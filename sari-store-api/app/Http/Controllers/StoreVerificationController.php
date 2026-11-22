<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Throwable;

class StoreVerificationController extends Controller
{
    private function ownerStore(Request $request): object
    {
        $user = $request->user();
        abort_unless($user->store_id, 403, 'This account is not part of a store');

        $store = DB::table('stores')->where('store_id', $user->store_id)->first();
        abort_unless($store && (int) $store->owner_id === (int) $user->getKey(), 403, 'Only the store owner can submit requirements');

        return $store;
    }

    /** @return array{required: array<int, array{key: string, label: string, hint: string}>, optional: array<int, array{key: string, label: string, hint: string}>} */
    private function catalog(string $storeType): array
    {
        $required = [
            ['key' => 'valid_id', 'label' => 'Valid government-issued ID', 'hint' => 'Upload a clear photo showing your name and ID details.'],
            ['key' => 'barangay_clearance', 'label' => $storeType === 'street_vendor' ? 'Barangay Clearance' : 'Barangay Business Clearance', 'hint' => 'Upload a clear photo of your current clearance.'],
            ['key' => 'business_permit', 'label' => $storeType === 'street_vendor' ? "Vending Permit / Mayor's Permit" : "Mayor's / Business Permit", 'hint' => 'Upload a clear photo of your current permit.'],
        ];

        $fire = ['key' => 'fire_safety_certificate', 'label' => 'Fire Safety Inspection Certificate', 'hint' => 'Optional; upload if your LGU or premises requires it.'];
        $sanitary = ['key' => 'sanitary_permit', 'label' => 'Sanitary Permit', 'hint' => 'Optional; upload if you sell or prepare food, or your LGU requires it.'];
        $health = ['key' => 'health_certificate', 'label' => 'Health Certificate', 'hint' => 'Optional; upload if you handle food and your LGU requires it.'];
        $businessRegistration = ['key' => 'dti_or_sec_registration', 'label' => 'DTI or SEC Registration', 'hint' => 'Optional; upload the registration that applies to your business.'];
        $bir = ['key' => 'bir_registration', 'label' => 'BIR Registration', 'hint' => 'Optional for this app check; follow BIR registration rules for your business.'];
        $fda = ['key' => 'fda_authorization', 'label' => 'FDA Authorization', 'hint' => 'Optional; upload if your activity requires FDA authorization.'];

        $optional = match ($storeType) {
            'street_vendor' => [$sanitary, $health],
            'mini_grocery' => [$fire, $sanitary],
            'convenience_store' => [$businessRegistration, $bir, $fire, $sanitary, $fda],
            'food_stall' => [$fire, $sanitary, $health],
            'online_seller' => [$businessRegistration, $bir, $fda],
            default => [$fire, $sanitary],
        };

        return ['required' => $required, 'optional' => $optional];
    }

    private function responseFor(object $store): array
    {
        $catalog = $this->catalog($store->store_type ?? 'other');
        $uploaded = DB::table('store_documents')->where('store_id', $store->store_id)->get()->keyBy('document_type');
        $format = static function (array $document) use ($uploaded): array {
            $saved = $uploaded->get($document['key']);

            return $document + [
                'uploaded' => (bool) $saved,
                'fileName' => $saved?->original_name,
            ];
        };
        $required = array_map($format, $catalog['required']);
        $complete = count(array_filter($required, static fn (array $document): bool => $document['uploaded']));

        return [
            'storeName' => $store->name,
            'storeType' => $store->store_type,
            'status' => $store->verification_status ?? 'verified',
            'required' => $required,
            'optional' => array_map($format, $catalog['optional']),
            'complete' => $complete,
            'total' => count($required),
            'autoApproval' => true,
        ];
    }

    public function show(Request $request): array
    {
        return ['verification' => $this->responseFor($this->ownerStore($request))];
    }

    public function upload(Request $request): array
    {
        $store = $this->ownerStore($request);
        $catalog = $this->catalog($store->store_type ?? 'other');
        $allowedTypes = array_column(array_merge($catalog['required'], $catalog['optional']), 'key');
        $values = $request->validate([
            'document_type' => ['required', 'string', Rule::in($allowedTypes)],
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ]);
        $storeId = (int) $store->store_id;
        $type = $values['document_type'];
        $photo = $values['photo'];
        $userId = (int) $request->user()->getKey();
        $disk = Storage::disk('local');
        $previousPath = DB::table('store_documents')->where('store_id', $storeId)->where('document_type', $type)->value('file_path');
        $path = $photo->storeAs("store-documents/{$storeId}", Str::uuid().'.'.$photo->extension(), 'local');
        abort_unless($path, 500, 'Could not save the document photo');

        try {
            $complete = DB::transaction(function () use ($storeId, $type, $photo, $path, $catalog, $userId): bool {
                DB::table('store_documents')->updateOrInsert(
                    ['store_id' => $storeId, 'document_type' => $type],
                    [
                        'file_path' => $path,
                        'original_name' => mb_substr($photo->getClientOriginalName(), 0, 255),
                        'mime_type' => $photo->getMimeType() ?? 'application/octet-stream',
                        'uploaded_by' => $userId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                );

                $requiredTypes = array_column($catalog['required'], 'key');
                $receivedTypes = DB::table('store_documents')
                    ->where('store_id', $storeId)
                    ->whereIn('document_type', $requiredTypes)
                    ->distinct()
                    ->count('document_type');
                $isComplete = $receivedTypes === count($requiredTypes);

                if ($isComplete) {
                    DB::table('stores')->where('store_id', $storeId)->where('verification_status', 'pending')->update([
                        'verification_status' => 'verified',
                        'verified_at' => now(),
                    ]);
                }

                return $isComplete;
            });
        } catch (Throwable $error) {
            $disk->delete($path);
            throw $error;
        }

        if ($previousPath && $previousPath !== $path) {
            $disk->delete($previousPath);
        }

        $store->verification_status = $complete ? 'verified' : ($store->verification_status ?? 'pending');

        return ['ok' => true, 'verified' => $complete, 'verification' => $this->responseFor($store)];
    }
}

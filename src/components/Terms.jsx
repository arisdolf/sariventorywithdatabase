export default function Terms({ onClose }) {
  return (
    <div className="ov" onClick={onClose}>
      <div className="card terms" onClick={e => e.stopPropagation()}>
        <h3>Terms and Conditions</h3>
        <div className="terms-body">
          <p><b>1. Using Sariventory.</b> Sariventory helps you record products, stock and sales for your store. You agree to use it lawfully and to give accurate information.</p>
          <p><b>2. Your account.</b> Keep your password private. You are responsible for what happens under your account. Store owners are responsible for the staff they invite and the roles they give them.</p>
          <p><b>3. Your store's records.</b> The products, prices and sales you enter belong to your store. Sariventory does not process payments. GCash, Maya and QR entries are only records of how a customer paid.</p>
          <p><b>4. Personal information.</b> We collect your name, birthdate and email to run your account, and, if you verify your store, the documents you submit. We use them only to operate and secure the service, and we do not sell them. You can ask us to delete your account at any time from your Profile page.</p>
          <p><b>5. Deleting an account.</b> Deleting your account removes your login and personal details. If you are a store owner, it also deletes your store's products, sales and stock records. This cannot be undone.</p>
          <p><b>6. Changes and availability.</b> We may update the app or these terms. We try to keep the service running but cannot promise it will always be available or error-free, so keep your own backups of important records.</p>
        </div>
        <button type="button" className="btn" style={{ marginTop: 14 }} onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
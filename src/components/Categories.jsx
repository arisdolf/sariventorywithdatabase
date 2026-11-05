import { api } from '../services/api'

const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '6px 0' }

export default function Categories({ D, run, setModal }) {
  const list = D.categories || []

  const add = () => setModal({
    title: 'Add category',
    fields: [{ n: 'name', l: 'Category name', req: 1 }],
    save: v => run(() => api('/categories', 'POST', v), 'Category added'),
  })
  const rename = c => setModal({
    title: 'Rename category',
    fields: [{ n: 'name', l: 'Category name', v: c.name, req: 1 }],
    save: v => run(() => api('/categories/' + c.id, 'PUT', v), 'Category renamed'),
  })
  const remove = c => {
    if (confirm('Delete the category "' + c.name + '"?')) run(() => api('/categories/' + c.id, 'DELETE'), 'Category deleted')
  }

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div style={row}>
        <h3 style={{ margin: 0 }}>Categories</h3>
        <button className="btn sm" onClick={add}>Add category</button>
      </div>
      {list.length ? list.map(c => {
        const n = D.products.filter(p => p.cat === c.name).length
        return (
          <div key={c.id} style={{ ...row, borderTop: '1px solid var(--line)' }}>
            <span>{c.name} <small style={{ color: 'var(--mute)' }}>· {n} product{n === 1 ? '' : 's'}</small></span>
            <span>
              <button className="btn ghost sm" onClick={() => rename(c)}>Rename</button>{' '}
              <button className="btn ghost sm" onClick={() => remove(c)}>Delete</button>
            </span>
          </div>
        )
      }) : <div className="empty">No categories yet. Add one.</div>}
    </div>
  )
}
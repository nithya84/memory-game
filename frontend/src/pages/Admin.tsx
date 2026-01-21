import React, { useState, useEffect } from 'react';
import '../styles/Admin.css';

const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3002/local';

interface Theme {
  id: string;
  name: string;
  description: string;
  style: string;
  imageCount: number;
  status: string;
  images?: Array<{
    id: string;
    url: string;
    thumbnailUrl: string;
    altText: string;
    selected?: boolean;
  }>;
}

export default function Admin() {
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || '');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Generate form
  const [themeName, setThemeName] = useState('');
  const [themeStyle, setThemeStyle] = useState('cartoon');
  const [imageCount, setImageCount] = useState(35);

  // Curation
  const [curatingTheme, setCuratingTheme] = useState<Theme | null>(null);

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem('adminToken', adminToken);
      loadThemes();
    }
  }, [adminToken]);

  const loadThemes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${ADMIN_API_URL}/admin/themes`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (!response.ok) throw new Error('Failed to load themes');
      const data = await response.json();
      setThemes(data.themes || []);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch(`${ADMIN_API_URL}/admin/themes/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          theme: themeName,
          style: themeStyle,
          count: imageCount
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to generate theme');
      }

      const data = await response.json();
      setSuccess(`Theme "${data.theme.name}" generated with ${data.theme.imageCount} images!`);
      setThemeName('');
      loadThemes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startCuration = async (themeId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${ADMIN_API_URL}/admin/themes/${themeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (!response.ok) throw new Error('Failed to load theme details');
      const data = await response.json();

      // Mark all images as selected by default
      const themeWithSelection = {
        ...data.theme,
        images: data.theme.images.map((img: any) => ({ ...img, selected: true }))
      };
      setCuratingTheme(themeWithSelection);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleImageSelection = (imageId: string) => {
    if (!curatingTheme) return;
    setCuratingTheme({
      ...curatingTheme,
      images: curatingTheme.images?.map(img =>
        img.id === imageId ? { ...img, selected: !img.selected } : img
      )
    });
  };

  const saveCuration = async () => {
    if (!curatingTheme) return;

    try {
      setLoading(true);
      const selectedImageIds = curatingTheme.images?.filter(img => img.selected).map(img => img.id) || [];

      const response = await fetch(`${ADMIN_API_URL}/admin/themes/${curatingTheme.id}/curate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selectedImageIds })
      });

      if (!response.ok) throw new Error('Failed to save curation');

      setSuccess(`Theme "${curatingTheme.name}" curated! ${selectedImageIds.length} images kept.`);
      setCuratingTheme(null);
      loadThemes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!adminToken) {
    return (
      <div className="admin-login">
        <h1>Admin Login</h1>
        <input
          type="password"
          placeholder="Enter admin token"
          value={adminToken}
          onChange={(e) => setAdminToken(e.target.value)}
        />
      </div>
    );
  }

  if (curatingTheme) {
    return (
      <div className="admin-container">
        <h1>Curate: {curatingTheme.name}</h1>
        <p>Click images to deselect. Selected images will be kept.</p>

        <div className="curation-actions">
          <button onClick={saveCuration} disabled={loading}>
            Save ({curatingTheme.images?.filter(img => img.selected).length} selected)
          </button>
          <button onClick={() => setCuratingTheme(null)}>Cancel</button>
        </div>

        <div className="curation-grid">
          {curatingTheme.images?.map(img => (
            <div
              key={img.id}
              className={`curation-image ${img.selected ? 'selected' : 'deselected'}`}
              onClick={() => toggleImageSelection(img.id)}
            >
              <img src={img.thumbnailUrl} alt={img.altText} />
              {!img.selected && <div className="deselected-overlay">❌</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h1>Theme Admin</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <section className="admin-section">
        <h2>Generate New Theme</h2>
        <form onSubmit={generateTheme}>
          <input
            type="text"
            placeholder="Theme name (e.g., Ocean Animals)"
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            required
          />
          <select value={themeStyle} onChange={(e) => setThemeStyle(e.target.value)}>
            <option value="cartoon">Cartoon</option>
            <option value="realistic">Realistic</option>
            <option value="simple">Simple</option>
          </select>
          <input
            type="number"
            placeholder="Number of images"
            value={imageCount}
            onChange={(e) => setImageCount(parseInt(e.target.value))}
            min={20}
            max={50}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Theme'}
          </button>
        </form>
      </section>

      <section className="admin-section">
        <h2>Existing Themes</h2>
        <button onClick={loadThemes} disabled={loading}>Refresh</button>

        {themes.length === 0 ? (
          <p>No themes found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Style</th>
                <th>Images</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {themes.map(theme => (
                <tr key={theme.id}>
                  <td>{theme.name}</td>
                  <td>{theme.style}</td>
                  <td>{theme.imageCount}</td>
                  <td>{theme.status}</td>
                  <td>
                    <button onClick={() => startCuration(theme.id)}>Curate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { twoFactorAPI } from '../services/api';
import './TwoFactorSetup.css';

const TwoFactorSetup = () => {
  const [secret, setSecret] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const handleGenerateSecret = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await twoFactorAPI.generateSecret();
      setSecret(response.data);
      setQrCode(response.data.qrCode);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate 2FA secret');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await twoFactorAPI.enable(token);
      setSuccess('2FA enabled successfully!');
      setIs2FAEnabled(true);
      setToken('');
      setSecret(null);
      setQrCode(null);
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = 'Failed to enable 2FA';
      
      if (errorData) {
        // Handle validation errors
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0].msg || errorData.errors[0].message || errorMessage;
        } 
        // Handle regular error messages
        else if (errorData.message) {
          errorMessage = errorData.message;
        } 
        // Handle error field
        else if (errorData.error) {
          errorMessage = errorData.error;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const check2FAStatus = async () => {
      try {
        const response = await twoFactorAPI.getStatus();
        setIs2FAEnabled(response.data.enabled);
      } catch {
        // If status check fails, assume 2FA is not enabled
        setIs2FAEnabled(false);
      } finally {
        setCheckingStatus(false);
      }
    };

    check2FAStatus();
  }, []);

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await twoFactorAPI.disable();
      setSuccess('2FA disabled successfully');
      setIs2FAEnabled(false);
      setSecret(null);
      setQrCode(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };


  if (checkingStatus) {
    return (
      <div className="two-factor-setup">
        <h1>Two-Factor Authentication</h1>
        <div className="card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="two-factor-setup">
      <h1>Two-Factor Authentication</h1>

      <div className="card">
        <h2>2FA Setup</h2>
        <p>
          Two-factor authentication adds an extra layer of security to your account.
          You'll need an authenticator app (like Google Authenticator or Authy) to use this feature.
        </p>

        {is2FAEnabled ? (
          <div className="disable-section">
            <div className="success-message" style={{ marginBottom: '1rem' }}>
              <strong>2FA is currently enabled</strong> for your account.
            </div>
            <button
              className="btn btn-danger"
              onClick={handleDisable2FA}
              disabled={loading}
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        ) : (
          <>
            {!secret && !qrCode && (
              <div>
                <button
                  className="btn btn-primary"
                  onClick={handleGenerateSecret}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate 2FA Secret'}
                </button>
              </div>
            )}

            {qrCode && (
              <div className="qr-section">
                <h3>Scan QR Code</h3>
                <p>Scan this QR code with your authenticator app:</p>
                <div className="qr-code-container">
                  <img src={qrCode} alt="2FA QR Code" />
                </div>
                <p className="manual-entry">
                  Or enter this code manually: <strong>{secret?.manualEntryKey}</strong>
                </p>

                <form onSubmit={handleEnable2FA}>
                  <div className="form-group">
                    <label className="form-label">
                      Enter 6-digit code from your authenticator app
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={token}
                      onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>
                  {error && <div className="error-message">{error}</div>}
                  {success && <div className="success-message">{success}</div>}
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Enabling...' : 'Enable 2FA'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setSecret(null);
                        setQrCode(null);
                        setToken('');
                        setError('');
                        setSuccess('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSetup;


import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../LoginForm';
import { describe, it, expect, vi } from 'vitest';
import * as authAPI from '../../../api/auth';

// Mock the API module
vi.mock('../../../api/auth', () => ({
  authAPI: {
    login: vi.fn()
  }
}));

// Mock the Auth Store
vi.mock('../../../store/authStore', () => ({
  useAuthStore: () => ((state) => state.setAuth) // returns a mock setAuth function
}));

describe('LoginForm', () => {
  it('renders email and password inputs', () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('calls login API when form is submitted', async () => {
    authAPI.authAPI.login.mockResolvedValue({
      success: true,
      data: { user: { name: 'Test' }, token: 'abc' }
    });

    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authAPI.authAPI.login).toHaveBeenCalledWith('test@example.com', 'password');
    });
  });
});
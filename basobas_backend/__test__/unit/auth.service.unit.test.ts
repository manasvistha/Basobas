import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthService } from '../../src/services/auth.service';
import { UserRepository } from '../../src/repositories/user.repository';
import { HttpError } from '../../src/errors/http-error';

jest.mock('../../src/models/user.model', () => ({
  UserModel: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('../../src/config/email', () => ({
  sendEmail: jest.fn(),
  transporter: { sendMail: jest.fn() },
}));

const { UserModel } = require('../../src/models/user.model');

const authService = new AuthService();

describe('AuthService unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('login succeeds with valid credentials', async () => {
    (UserModel.findOne as jest.Mock).mockResolvedValue({
      _id: 'u1',
      role: 'user',
      email: 'test@example.com',
      comparePassword: jest.fn().mockResolvedValue(true),
      toJSON: () => ({ id: 'u1', email: 'test@example.com', role: 'user' }),
    });

    const result: any = await authService.login({ email: 'Test@Example.com ', password: 'password123' });
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.id).toBe('u1');
    expect(result.token).toBeDefined();
  });

  test('login throws when user not found', async () => {
    (UserModel.findOne as jest.Mock).mockResolvedValue(null);
    await expect(authService.login({ email: 'missing@example.com', password: 'pass' })).rejects.toThrow('Invalid credentials');
  });

  test('login throws when password mismatched', async () => {
    (UserModel.findOne as jest.Mock).mockResolvedValue({
      comparePassword: jest.fn().mockResolvedValue(false),
    });
    await expect(authService.login({ email: 'user@example.com', password: 'wrong' })).rejects.toThrow('Invalid credentials');
  });

  test('register rejects duplicate email', async () => {
    (UserModel.findOne as jest.Mock).mockResolvedValue({ _id: 'existing' });
    await expect(authService.register({ email: 'dup@example.com', password: 'x' })).rejects.toThrow('User with this email already exists');
  });

  test('register lowercases email and username', async () => {
    (UserModel.findOne as jest.Mock).mockResolvedValue(null);
    (UserModel.create as jest.Mock).mockImplementation(async (payload: any) => payload);

    const user = await authService.register({ email: 'UPPER@EXAMPLE.COM ', username: 'MyName', password: 'secret' });
    expect(UserModel.create).toHaveBeenCalledWith({ email: 'upper@example.com', username: 'myname', password: 'secret' });
    expect(user.email).toBe('upper@example.com');
  });

  test('sendResetPasswordEmail requires email', async () => {
    await expect(authService.sendResetPasswordEmail(undefined)).rejects.toBeInstanceOf(HttpError);
  });

  test('sendResetPasswordEmail errors when user missing', async () => {
    jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValue(null as any);
    await expect(authService.sendResetPasswordEmail('nobody@example.com')).rejects.toBeInstanceOf(HttpError);
  });

  test('sendResetPasswordEmail generates token and sends email', async () => {
    const fakeUser = { _id: 'user123', email: 'user@example.com' } as any;
    const sendEmail = require('../../src/config/email').sendEmail as jest.Mock;
    jest.spyOn(UserRepository.prototype, 'getUserByEmail').mockResolvedValue(fakeUser);

    const result = await authService.sendResetPasswordEmail('user@example.com');
    expect(result).toBe(fakeUser);
    expect(sendEmail).toHaveBeenCalled();
  });

  test('resetPassword rejects missing token', async () => {
    await expect(authService.resetPassword(undefined, 'newpass')).rejects.toBeInstanceOf(HttpError);
  });

  test('resetPassword rejects missing new password', async () => {
    const token = jwt.sign({ id: 'u1' }, process.env.JWT_SECRET || 'supersecretkeynn');
    await expect(authService.resetPassword(token, undefined)).rejects.toBeInstanceOf(HttpError);
  });

  test('resetPassword updates password for valid token', async () => {
    const token = jwt.sign({ id: 'u1' }, process.env.JWT_SECRET || 'supersecretkeynn', { expiresIn: '1h' });
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValue({ _id: 'u1', email: 'user@example.com' } as any);
    (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({ _id: 'u1' });

    const user = await authService.resetPassword(token, 'brand-new-password');
    expect(user?._id).toBe('u1');
    expect(UserModel.findByIdAndUpdate).toHaveBeenCalled();
  });

  test('resetPassword throws on invalid token', async () => {
    // Tampered token should fail verification
    await expect(authService.resetPassword('bad-token', 'pass')).rejects.toBeInstanceOf(HttpError);
  });
});

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Password dan Konfirmasi Password tidak cocok');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username harus minimal 3 karakter');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
          },
        },
      });

      if (error) throw error;
      
      // If email confirmation is enabled, guide them, otherwise login was successful
      if (data.session) {
        navigate('/');
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat pendaftaran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen pt-32 md:pt-36 pb-12 px-4">
      <motion.div
        className="w-full max-w-[400px] bg-white rounded-[13px] p-8"
        style={{ boxShadow: 'rgb(0, 0, 0) 0px 0px 0px 2px inset' }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <h1 className="text-[40px] text-black font-[800] leading-[1.07] m-0 mb-6">DAFTAR.</h1>

        {error && (
          <div className="bg-red-50 text-red-600 border-2 border-red-600 rounded-xl px-4 py-2 text-[14px] font-[800] mb-4">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 border-2 border-green-600 rounded-xl px-4 py-2 text-[14px] font-[800] mb-4">
            ✅ Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi pendaftaran.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[14px] font-[800] text-black block mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-3 rounded-[38px] text-[16px] font-[400] text-black bg-white border-none outline-none"
              style={{ boxShadow: 'rgb(0, 0, 0) 0px 0px 0px 2px inset' }}
              placeholder="namakamu"
              required
            />
          </div>
          <div>
            <label className="text-[14px] font-[800] text-black block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3 rounded-[38px] text-[16px] font-[400] text-black bg-white border-none outline-none"
              style={{ boxShadow: 'rgb(0, 0, 0) 0px 0px 0px 2px inset' }}
              placeholder="kamu@email.com"
              required
            />
          </div>
          <div>
            <label className="text-[14px] font-[800] text-black block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3 rounded-[38px] text-[16px] font-[400] text-black bg-white border-none outline-none"
              style={{ boxShadow: 'rgb(0, 0, 0) 0px 0px 0px 2px inset' }}
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="text-[14px] font-[800] text-black block mb-2">Konfirmasi Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-5 py-3 rounded-[38px] text-[16px] font-[400] text-black bg-white border-none outline-none"
              style={{ boxShadow: 'rgb(0, 0, 0) 0px 0px 0px 2px inset' }}
              placeholder="••••••••"
              required
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-[38px] text-[16px] font-[800] text-white cursor-pointer border-none mt-4 flex items-center justify-center ${
              loading ? 'bg-black/60 cursor-wait' : 'bg-black hover:bg-gray-800'
            }`}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'MENDAFTARKAN...' : 'DAFTAR'}
          </motion.button>
        </form>

        <p className="text-[14px] font-[400] text-black/60 text-center mt-6 m-0">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-[#7333f1] font-[800] no-underline hover:underline">Masuk</Link>
        </p>
      </motion.div>
    </div>
  );
};

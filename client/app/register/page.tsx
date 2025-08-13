'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { setAuth, getRoleDashboardPath } from '@/lib/auth';
import { authAPI } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

declare global { interface Window { google?: any } }

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'worker',
    phone: '',
    location: '',
    bio: '',
    skills: '',
    experience: '',
    hourlyRate: '',
    company: '',
    industry: '',
    website: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Prepare registration data based on role
      interface RegistrationProfile {
        phone: string;
        location: string;
        bio: string;
        skills?: string[];
        experience?: number;
        hourlyRate?: number;
        company?: string;
        industry?: string;
        website?: string;
      }

      interface RegistrationData {
        name: string;
        email: string;
        password: string;
        role: string;
        profile: RegistrationProfile;
      }

      const registrationData: RegistrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profile: {
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
        },
      };

      // Add role-specific fields
      if (formData.role === 'worker') {
        registrationData.profile.skills = formData.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
        registrationData.profile.experience = parseInt(formData.experience) || 0;
        registrationData.profile.hourlyRate = parseFloat(formData.hourlyRate) || 0;
      } else if (formData.role === 'client') {
        registrationData.profile.company = formData.company;
        registrationData.profile.industry = formData.industry;
        registrationData.profile.website = formData.website;
      }

      const response = await authAPI.register(registrationData as unknown as Record<string, unknown>);
      const { token, user } = response.data;

      setAuth(token, user);
      // Notify all tabs and components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('authChanged'));
      }
      router.push(getRoleDashboardPath(user.role));
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
        setError((error as { response: { data: { message: string } } }).response.data.message);
      } else {
        setError('Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Sign Up (with role)
  useEffect(() => {
    const existing = document.getElementById('google-identity');
    if (existing) { setGoogleReady(true); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.id = 'google-identity';
    s.onload = () => setGoogleReady(true);
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (!googleReady) return;
    if (!window.google || !window.google.accounts?.id) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    if (!clientId) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (resp: any) => {
        try {
          const res = await authAPI.loginWithGoogle(resp.credential, formData.role as 'worker'|'client');
          const { token, user } = res.data;
          setAuth(token, user);
          if (typeof window !== 'undefined') window.dispatchEvent(new Event('authChanged'));
          router.push(getRoleDashboardPath(user.role));
        } catch (e) {
          console.error(e);
          setError('Google sign-up failed. If you already have an account with this email, please use Login.');
        }
      }
    });
    if (googleBtnRef.current) {
      googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard', theme: 'outline', size: 'large', text: 'signup_with', shape: 'rectangular', logo_alignment: 'left'
      });
    }
  }, [googleReady, formData.role, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Input
              label="Full Name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
            />

            <Input
              label="Email address"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
            />

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="worker">Worker (Freelancer)</option>
                <option value="client">Client (Employer)</option>
              </select>
            </div>

            {/* Google Sign Up Button */}
            <div className="flex justify-center">
              <div ref={googleBtnRef} />
            </div>

            <Input
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
            />

            <Input
              label="Location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
            />

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Worker-specific fields */}
            {formData.role === 'worker' && (
              <>
                <Input
                  label="Skills (comma-separated)"
                  name="skills"
                  type="text"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="e.g. JavaScript, React, Node.js"
                />

                <Input
                  label="Years of Experience"
                  name="experience"
                  type="number"
                  min="0"
                  value={formData.experience}
                  onChange={handleChange}
                />

                <Input
                  label="Hourly Rate (ETB)"
                  name="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                />
              </>
            )}

            {/* Client-specific fields */}
            {formData.role === 'client' && (
              <>
                <Input
                  label="Company Name"
                  name="company"
                  type="text"
                  value={formData.company}
                  onChange={handleChange}
                />

                <Input
                  label="Industry"
                  name="industry"
                  type="text"
                  value={formData.industry}
                  onChange={handleChange}
                />

                <Input
                  label="Website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                />
              </>
            )}

            <Input
              label="Password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
            />

            <Button
              type="submit"
              className="w-full"
              loading={loading}
            >
              Create Account
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;

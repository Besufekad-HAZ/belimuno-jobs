'use client';

import React from 'react';
import { Users, Target, Eye, Heart, Award, MapPin, Phone, Mail, Globe } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from 'next/link';

const AboutPage: React.FC = () => {
  // clients now come from shared data

  const teamMembers = [
    { name: 'Managing Director', department: 'Management', role: 'ANALYST ASSETS' },
    { name: 'Human Resource Department Head', department: 'HR', role: 'ELIAS KETEMA' },
    { name: 'Manpower Supply Division', department: 'Operations', role: 'SENAIT AYALEW' },
    { name: 'Outsourced Service Management Dept', department: 'Operations', role: 'FIRST TADESSE' },
    { name: 'Finance Division', department: 'Finance', role: 'MAMDOUH ABEBE' },
    { name: 'Other Crew Division', department: 'Operations', role: 'C.T. ALEMAYEHU MESFASH' },
    { name: 'Admin & Finance Department', department: 'Administration', role: 'HONEYWEST TEKA' },
  ];

  const values = [
    {
      title: 'Adhocracy',
      description: 'Our flexible management system enables us hire tailored to fit workforce',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      title: 'Reliability',
      description: 'We always strive to keep what we promised',
      color: 'bg-green-50 border-green-200 text-green-800'
    },
    {
      title: 'Trustworthy',
      description: 'We are devoted to be your trusted partners',
      color: 'bg-purple-50 border-purple-200 text-purple-800'
    },
    {
      title: 'Integrity',
      description: 'We promise only what we deliver and we can deliver on every promise',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-800'
    },
    {
      title: 'Specialty',
      description: 'We are seasoned professionals continuously educating ourselves, ready for future challenges',
      color: 'bg-cyan-50 border-cyan-200 text-cyan-800'
    },
    {
      title: 'Technicality',
      description: 'We believe every challenge has unique solution and technically deal with each accordingly',
      color: 'bg-orange-50 border-orange-200 text-orange-800'
    },
    {
      title: 'Incorruptibility',
      description: 'Never involved and will never in fraudulent acts',
      color: 'bg-red-50 border-red-200 text-red-800'
    },
    {
      title: 'Creativity',
      description: 'We are always looking for new ways to enhance our customers\' satisfaction',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">About Belimuno</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              HR Outsourcing Solution - Connecting talent with opportunities across Ethiopia since 2011
            </p>
            <div className="mt-8">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-lg px-6 py-2">
                "Work Smarter Not Harder!"
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Executive Summary</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 mx-auto"></div>
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 p-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              Belimuno HR outsourcing solution was established in 2011 as Belimuno recruiting service to provide
              manpower outsourcing services. Since then it has been outsourcing security guards, cleaners and
              construction workers for various renowned organizations. During its course of operation, Belimuno
              expanded its services to include professional manpower supply, consultancy and HR training services
              which in turn made it improve its name to Belimuno HR outsourcing solution.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mt-4">
              The company currently has an annual turnover of about 200 million birr and is one of the fast growing
              firms in the sector. Its clients include international NGOs like WFP, NRS and FHI; International
              construction firms like China Genzuba group, Dong Fang electrics, Kalpataru group and Alec fitout
              engineering. Belimuno is currently managing over 3000 employees for 36 organizations.
            </p>
          </Card>
        </div>
      </section>

      {/* Vision, Mission, Values */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Vision */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 text-center p-8">
              <Eye className="h-16 w-16 text-purple-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-purple-900 mb-4">Vision</h3>
              <p className="text-gray-700">
                To be the most reliable human resource outsourcing service providers and trusted partners
                through staffing a tailored to fit manpower to our clients.
              </p>
            </Card>

            {/* Mission */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 text-center p-8">
              <Target className="h-16 w-16 text-blue-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-blue-900 mb-4">Mission</h3>
              <p className="text-gray-700">
                Searching, refining and staffing professional and non-professional manpower where they
                best fit and consult our clients with ideas leading them to success.
              </p>
            </Card>

            {/* Values */}
            <Card className="bg-gradient-to-br from-cyan-50 to-green-50 border-cyan-200 text-center p-8">
              <Heart className="h-16 w-16 text-cyan-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-cyan-900 mb-4">Values</h3>
              <p className="text-gray-700">
                Built on integrity, reliability, and innovation - we deliver excellence through our
                core values that guide every decision and action.
              </p>
            </Card>
          </div>

          {/* Detailed Values */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Our Core Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {values.map((value, index) => (
                <Card key={index} className={`${value.color} p-4`}>
                  <h4 className="font-bold mb-2">{value.title}</h4>
                  <p className="text-sm">{value.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section className="py-16 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Manpower Supply</h3>
                <p className="text-gray-600">
                  Professional manpower supply with a well-developed database and experienced HR professionals
                  who can recruit the best talent for our clients.
                </p>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <Award className="h-12 w-12 text-cyan-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Manpower Outsourcing</h3>
                <p className="text-gray-600">
                  Comprehensive outsourcing services including cleaners, security guards, construction crews,
                  and fleet management professionals for over 3000 employees.
                </p>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <Target className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">HR Consultancy</h3>
                <p className="text-gray-600">
                  Human resource consultancy services including assessment in the selection process
                  as well as training & development for various business organizations.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Team</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              BELIMUNO is divided into three main departments: administration and finance, human resources,
              and outsourced service management. Each department handles administrative tasks, procurements,
              and financial activities, while the outsourced service management department manages outsourced
              staff and projects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{member.name}</h3>
                  <Badge variant="primary" className="mb-2">{member.department}</Badge>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Clients */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Clients</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600">
              BELIMUNO Human outsource solution is one of the leading companies in the industry.
              It has been operating in the field since 2012 and served more than fifty international,
              business, and non-governmental organizations.
            </p>
          </div>

          <div className="text-center">
            <Link href="/clients">
              <Button>View Our Clients</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
            <div className="w-24 h-1 bg-white/30 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-cyan-300 mx-auto mb-4" />
              <h3 className="font-bold mb-2">Address</h3>
              <p className="text-blue-100">
                Bole Medhaniyalem to Hayahulet Road<br />
                In front of new Stadium<br />
                ANAT Commercial Center<br />
                4th floor office No 402
              </p>
            </div>

            <div className="text-center">
              <Phone className="h-12 w-12 text-cyan-300 mx-auto mb-4" />
              <h3 className="font-bold mb-2">Phone</h3>
              <div className="text-blue-100 space-y-1">
                <p>+251 930 014 332</p>
                <p>+251 978 009 084</p>
                <p>+251 935 402 673</p>
                <p>+251 913 064 948</p>
              </div>
            </div>

            <div className="text-center">
              <Mail className="h-12 w-12 text-cyan-300 mx-auto mb-4" />
              <h3 className="font-bold mb-2">Email & P.O.Box</h3>
              <div className="text-blue-100 space-y-1">
                <p>info@belimunojobs.com</p>
                <p>P.o.box. 100144</p>
                <p>Addis Ababa</p>
              </div>
            </div>

            <div className="text-center">
              <Globe className="h-12 w-12 text-cyan-300 mx-auto mb-4" />
              <h3 className="font-bold mb-2">Website</h3>
              <p className="text-blue-100">www.belimunojobs.com</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-xl text-cyan-200 font-semibold">
              "The only way to do great work is to love what you do. And we Love what we do! That's why we say come to Us."
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

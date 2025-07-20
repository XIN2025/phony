'use client';
import Image from 'next/image';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  MessageCircle,
  Sparkles,
  Workflow,
  ClipboardList,
  Users,
  NotebookPen,
  ArrowRight,
  CheckCircle,
  Star,
  Heart,
  Zap,
  MapPin,
  Mail,
  Phone,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  User,
  Bot,
  TrendingUp,
  Menu,
  X,
  UserCheck,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  const handleRoleSelection = (role: 'practitioner' | 'client', action: 'signin' | 'signup') => {
    if (role === 'practitioner') {
      if (action === 'signup') {
        router.push('/practitioner/auth/signup');
      } else {
        router.push('/practitioner/auth');
      }
    } else {
      // Clients can only sign in, not sign up directly
      router.push('/client/auth');
    }
  };

  return (
    <div className='min-h-screen bg-white'>
      {/* Navigation */}
      <nav className='fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center space-x-2'>
              <Image src='/infinity.png' alt='Continuum' width={32} height={32} className='w-10 h-4' />
              <span className='text-xl font-semibold text-gray-800'>CONTINUUM</span>
            </div>

            {/* Desktop Navigation */}
            <div className='hidden md:flex items-center space-x-8'>
              <a href='#home' className='text-gray-800 font-medium border-b-2 border-gray-800 pb-1'>
                Home
              </a>
              <a href='#features' className='text-gray-600 hover:text-gray-800 transition-colors'>
                Features
              </a>
              <a href='#about' className='text-gray-600 hover:text-gray-800 transition-colors'>
                About Us
              </a>
            </div>

            {/* Desktop Buttons */}
            <div className='hidden md:flex items-center space-x-4'>
              <Button
                variant='outline'
                className='border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white'
                onClick={() => setShowRoleSelection(true)}
              >
                <LogIn className='w-4 h-4 mr-2' />
                Sign In
              </Button>
              <Button className='bg-gray-800 text-white hover:bg-gray-700' onClick={() => setShowRoleSelection(true)}>
                <UserPlus className='w-4 h-4 mr-2' />
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button className='md:hidden p-2' onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className='md:hidden py-4 border-t border-gray-200'>
              <div className='flex flex-col space-y-4'>
                <a href='#home' className='text-gray-800 font-medium'>
                  Home
                </a>
                <a href='#features' className='text-gray-600 hover:text-gray-800 transition-colors'>
                  Features
                </a>
                <a href='#about' className='text-gray-600 hover:text-gray-800 transition-colors'>
                  About Us
                </a>
                <div className='flex flex-col space-y-2 pt-4'>
                  <Button
                    variant='outline'
                    className='border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white'
                    onClick={() => setShowRoleSelection(true)}
                  >
                    <LogIn className='w-4 h-4 mr-2' />
                    Sign In
                  </Button>
                  <Button
                    className='bg-gray-800 text-white hover:bg-gray-700'
                    onClick={() => setShowRoleSelection(true)}
                  >
                    <UserPlus className='w-4 h-4 mr-2' />
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Role Selection Modal */}
      {showRoleSelection && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className='bg-white rounded-2xl p-6 w-full max-w-md'
          >
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-2xl font-bold text-gray-800'>Choose Your Role</h2>
              <button
                onClick={() => setShowRoleSelection(false)}
                className='p-2 hover:bg-gray-100 rounded-full transition-colors'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='space-y-4'>
              {/* Practitioner Section */}
              <div className='border border-gray-200 rounded-xl p-4'>
                <div className='flex items-center space-x-3 mb-3'>
                  <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                    <UserCheck className='w-5 h-5 text-blue-600' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-gray-800'>Practitioner</h3>
                    <p className='text-sm text-gray-600'>Therapists, Coaches, Counselors</p>
                  </div>
                </div>
                <div className='flex space-x-2'>
                  <Button
                    variant='outline'
                    className='flex-1'
                    onClick={() => handleRoleSelection('practitioner', 'signin')}
                  >
                    Sign In
                  </Button>
                  <Button
                    className='flex-1 bg-blue-600 hover:bg-blue-700'
                    onClick={() => handleRoleSelection('practitioner', 'signup')}
                  >
                    Sign Up
                  </Button>
                </div>
              </div>

              {/* Client Section */}
              <div className='border border-gray-200 rounded-xl p-4'>
                <div className='flex items-center space-x-3 mb-3'>
                  <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                    <User className='w-5 h-5 text-green-600' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-gray-800'>Client</h3>
                    <p className='text-sm text-gray-600'>Patients, Clients, Students</p>
                  </div>
                </div>
                <div className='space-y-3'>
                  <Button
                    className='w-full bg-green-600 hover:bg-green-700'
                    onClick={() => handleRoleSelection('client', 'signin')}
                  >
                    Sign In
                  </Button>
                  <div className='bg-gray-50 rounded-lg p-3 text-center'>
                    <p className='text-sm text-gray-600 mb-2'>
                      Need an account? Ask your practitioner to send you an invitation.
                    </p>
                    <p className='text-xs text-gray-500'>
                      Clients can only join with an invitation from their practitioner.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Hero Section */}
      <section id='home' className='pt-20 pb-16 px-4 sm:px-6 lg:px-8 cloudy-gradient-background'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16'>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className='text-center lg:text-left'
            >
              <h1 className='text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-800 mb-6 leading-tight'>
                <span className='text-gray-600 font-serif'>Where Therapy &</span>
                <br />
                <span className='text-gray-800'>Coaching Becomes</span>
                <br />
                <span className='text-gray-800'>Action & Accountability</span>
              </h1>
              <p className='text-base sm:text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0'>
                Extend the impact of your work beyond sessions, through structure, accountability, and communication
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center lg:justify-start'>
                <Button
                  size='lg'
                  className='bg-gray-800 text-white hover:bg-gray-700 px-8 py-3 text-lg'
                  onClick={() => setShowRoleSelection(true)}
                >
                  <UserPlus className='w-5 h-5 mr-2' />
                  Get Started
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  className='border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white px-8 py-3 text-lg'
                  onClick={() => setShowRoleSelection(true)}
                >
                  <LogIn className='w-5 h-5 mr-2' />
                  Sign In
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='relative'
            >
              <div className='relative bg-gray-200 rounded-2xl overflow-hidden h-64 sm:h-80 lg:h-96 xl:h-[500px] shadow-xl'>
                <Image src='/auth.jpg' alt='Therapy session' fill className='object-cover grayscale' />

                {/* Top-right testimonial */}
                <div className='absolute top-4 right-4 sm:top-8 sm:right-8'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden'>
                      <User className='w-6 h-6 text-gray-600' />
                    </div>
                    <div className='bg-white rounded-lg p-3 shadow-lg max-w-48'>
                      <p className='text-sm text-gray-800'>I am in a much better place than I was 2 years ago</p>
                    </div>
                  </div>
                </div>

                {/* Mid-right testimonial */}
                <div className='absolute top-1/3 right-4 sm:right-8 hidden sm:block'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden'>
                      <User className='w-6 h-6 text-gray-600' />
                    </div>
                    <div className='bg-white rounded-lg p-3 shadow-lg max-w-48'>
                      <p className='text-sm text-gray-800'>I am in a much better place than I was 2 years ago</p>
                    </div>
                  </div>
                </div>

                {/* Bottom-left testimonial */}
                <div className='absolute bottom-4 left-4 sm:bottom-8 sm:left-8'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden'>
                      <User className='w-6 h-6 text-gray-600' />
                    </div>
                    <div className='bg-white rounded-lg p-3 shadow-lg max-w-48'>
                      <p className='text-sm text-gray-800'>I am in a much better place than I was 2 years ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* What We Do Section - Now part of the same section */}
          <div
            className='max-w-4xl mx-auto text-center'
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #fbeaec 0%, #f7f3f2 100%)',
              borderRadius: '1rem',
              padding: '2.5rem 1.5rem',
              marginTop: '2rem',
              marginBottom: '2rem',
            }}
          >
            <motion.h2
              className='text-3xl sm:text-4xl font-bold text-gray-800 mb-8 font-serif'
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              What We Do
            </motion.h2>
            <motion.div
              className=' backdrop-blur-sm rounded-xl p-2 shadow-sm border border-gray-100'
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p className='text-base sm:text-lg text-gray-800 leading-relaxed'>
                Continuum is a practitioner-first platform that turns conversations into notes into action. Using
                secure, AI-assisted tools, we help therapists and coaches create personalised daily programmes — so
                clients stay supported, engaged, and moving forward between sessions.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id='features' className='py-16 px-4 sm:px-6 lg:px-8 bg-white'>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            className='text-center mb-12 sm:mb-16'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className='text-3xl sm:text-4xl font-bold text-gray-800 mb-4 font-serif'>How It Works</h2>
            <p className='text-lg sm:text-xl text-gray-600'>Four simple steps to transform your practice</p>
          </motion.div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8'>
            {[
              {
                number: '1',
                title: 'Session',
                description:
                  'Run your session as normal. Continuum captures and structures key insights — no extra admin needed',
              },
              {
                number: '2',
                title: 'Plan',
                description:
                  'AI drafts a personalised programme based on verbatim tasks and suggested tasks. These tasks then include potential actions, reflections, and resources. You edit or approve with one click.',
              },
              {
                number: '3',
                title: 'Engage',
                description:
                  'Clients get their plan via an app, showing up in a daily format — They can tick off tasks, journal and give feedback. You can communicate with your clients any time via secure in-app messaging.',
              },
              {
                number: '4',
                title: 'Track',
                description:
                  "Get real-time visibility into client progress, plus weekly summaries before each session — so you know exactly what's working and what's not.",
              },
            ].map((step, index) => (
              <motion.div
                key={step.number}
                className='bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200'
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className='w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center text-sm font-bold mb-4'>
                  {step.number}
                </div>
                <h3 className='text-lg sm:text-xl font-bold text-gray-800 mb-3'>{step.title}</h3>
                <p className='text-sm sm:text-base text-gray-600 leading-relaxed'>{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solving the Biggest Gaps Section */}
      <section className='py-16 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            className='text-center mb-12 sm:mb-16'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className='text-3xl sm:text-4xl font-bold text-gray-800 mb-4 font-serif'>
              Solving the Biggest Gaps in Coaching & Therapy
            </h2>
            <p className='text-lg sm:text-xl text-gray-600'>
              Purpose-built tools that address real practitioner challenges
            </p>
          </motion.div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8'>
            {[
              {
                icon: <NotebookPen className='w-6 h-6' />,
                title: 'Effortless Notes',
                description: 'AI-assisted note-taking means you focus on your client — not your keyboard.',
              },
              {
                icon: <MessageCircle className='w-6 h-6' />,
                title: 'Daily Client Support',
                description: 'Personalised, simple programmes to keep clients engaged and aligned with their goals.',
              },
              {
                icon: <TrendingUp className='w-6 h-6' />,
                title: 'Progress Visibility',
                description: "See what's getting done and what's falling behind — in one smart dashboard.",
              },
              {
                icon: <Mail className='w-6 h-6' />,
                title: 'One Secure Inbox',
                description:
                  'Keep all client conversations in one encrypted, private space — no more scattered messages.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className='bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow'
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                    index === 0
                      ? 'bg-blue-100'
                      : index === 1
                        ? 'bg-green-100'
                        : index === 2
                          ? 'bg-purple-100'
                          : 'bg-pink-100'
                  }`}
                >
                  <div
                    className={
                      index === 0
                        ? 'text-blue-600'
                        : index === 1
                          ? 'text-green-600'
                          : index === 2
                            ? 'text-purple-600'
                            : 'text-pink-600'
                    }
                  >
                    {feature.icon}
                  </div>
                </div>
                <h3 className='text-lg sm:text-xl font-bold text-gray-800 mb-3'>{feature.title}</h3>
                <p className='text-sm sm:text-base text-gray-600 leading-relaxed'>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Built on Trust Section */}
      <section className='py-16 px-4 sm:px-6 lg:px-8 cloudy-gradient-background' style={{ minHeight: 'auto' }}>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            className='text-center mb-12 sm:mb-16'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className='text-3xl sm:text-4xl font-bold text-gray-800 mb-4 font-serif'>Built on Trust</h2>
            <p className='text-lg sm:text-xl text-gray-600'>Security, privacy and practitioner autonomy at our core</p>
          </motion.div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'>
            {[
              {
                icon: <User className='w-6 h-6' />,
                title: "You're In Control",
                description: 'Nothing gets sent to clients without your approval',
              },
              {
                icon: <Lock className='w-6 h-6' />,
                title: 'Privacy-First',
                description: 'All data is encrypted and secured to the highest standard',
              },
              {
                icon: <Bot className='w-6 h-6' />,
                title: 'AI That Supports',
                description: 'Continuum enhances & elevates what you do, but critically does not replace you',
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                className='bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100'
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className='w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4'>
                  {item.icon}
                </div>
                <h3 className='text-lg sm:text-xl font-bold text-gray-800 mb-3'>{item.title}</h3>
                <p className='text-sm sm:text-base text-gray-600 leading-relaxed'>{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Got Feedback Section */}
      <section id='about' className='py-16 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-4xl mx-auto text-center'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className='text-3xl sm:text-4xl font-bold text-gray-800 mb-4 font-serif'>Got Feedback?</h2>
            <p className='text-lg sm:text-xl text-gray-600 italic mb-4'>We'd love to hear it.</p>
            <p className='text-base sm:text-lg text-gray-600 mb-8 max-w-2xl mx-auto'>
              Whether you're a client or a clinician, your ideas matter. Leave a suggestion, request a feature, or just
              let us know what you think
            </p>

            <div className='bg-white rounded-xl p-6 sm:p-8 shadow-sm max-w-2xl mx-auto'>
              <form className='space-y-6 text-left'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>User Type</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder='Select your user type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='client'>Client</SelectItem>
                      <SelectItem value='practitioner'>Practitioner</SelectItem>
                      <SelectItem value='other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    What would you like to see improved or added?
                  </label>
                  <Textarea
                    placeholder='Share your thoughts, suggestions, or feature requests...'
                    className='min-h-[120px]'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Email (Optional)</label>
                  <Input placeholder="If you'd like a reply" />
                </div>

                <Button type='submit' className='w-full bg-gray-800 text-white hover:bg-gray-700'>
                  Submit Feedback
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className='py-12 px-4 sm:px-6 lg:px-8 bg-gray-800 text-white'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-center'>
            <div className='flex items-center space-x-2'>
              <Image src='/infinity.png' alt='Continuum' width={72} height={32} className='w-80 h-8' />
              <span className='text-xl font-semibold'>CONTINUUM</span>
            </div>

            <div className='sm:col-span-2 flex flex-col space-y-2'>
              <div className='flex items-center space-x-2'>
                <MapPin className='w-4 h-4' />
                <span className='text-sm sm:text-base'>123 Street, ABC, CF, USA, 000000</span>
              </div>
              <div className='flex items-center space-x-2'>
                <Mail className='w-4 h-4' />
                <span className='text-sm sm:text-base'>info@continuum.com</span>
              </div>
              <div className='flex items-center space-x-2'>
                <Phone className='w-4 h-4' />
                <span className='text-sm sm:text-base'>+011234567890</span>
              </div>
            </div>

            <div className='flex flex-col items-start sm:items-end space-y-4'>
              <div className='flex space-x-4'>
                <Facebook className='w-5 h-5 cursor-pointer hover:text-gray-300 transition-colors' />
                <Instagram className='w-5 h-5 cursor-pointer hover:text-gray-300 transition-colors' />
                <Linkedin className='w-5 h-5 cursor-pointer hover:text-gray-300 transition-colors' />
                <Twitter className='w-5 h-5 cursor-pointer hover:text-gray-300 transition-colors' />
              </div>
              <p className='text-xs sm:text-sm text-gray-400'>Continuum © 2025 All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

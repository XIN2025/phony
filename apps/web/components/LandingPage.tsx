'use client';
import Image from 'next/image';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
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
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: <NotebookPen className='w-6 h-6' />,
      title: 'Effortless Notetaking',
      description:
        'AI-powered session transcription and note-taking that captures key insights while you focus on your clients.',
    },
    {
      icon: <Sparkles className='w-6 h-6' />,
      title: 'Smart Task Generation',
      description: 'AI suggests personalized daily tasks from your sessions that you can approve or edit in seconds.',
    },
    {
      icon: <Users className='w-6 h-6' />,
      title: 'Real-time Monitoring',
      description: 'Track client progress and engagement through our comprehensive dashboard and journal features.',
    },
    {
      icon: <ShieldCheck className='w-6 h-6' />,
      title: 'AI-Assisted Insights',
      description: "Receive weekly progress summaries and session recaps to better understand your client's journey.",
    },
    {
      icon: <MessageCircle className='w-6 h-6' />,
      title: 'Secure Messaging',
      description: 'Integrated, confidential communication channel to keep all client conversations organized.',
    },
    {
      icon: <Zap className='w-6 h-6' />,
      title: 'Continuous Support',
      description: 'Extend your therapeutic impact beyond scheduled appointments with daily client engagement.',
    },
  ];

  const benefits = [
    '100% practitioner control - nothing sent without your approval',
    'Bank-level encryption and data security',
    'HIPAA compliant communication channels',
    'Ethical AI designed to augment, not replace',
    'Real-time client progress tracking',
    'Exportable session notes and insights',
  ];

  return (
    <div className='min-h-screen bg-gradient-to-r from-red-50 via-yellow-25 to-blue-50'>
      {/* Navigation */}
      <nav className='fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-border z-50'>
        <div className='max-w-7xl mx-auto px-2 sm:px-4 lg:px-8'>
          <div className='flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-2 sm:py-0'>
            <div className='flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-0'>
              <Image
                src='/logo.svg'
                alt='Continuum'
                width={132}
                height={132}
                className='w-32 h-12 sm:w-60 sm:h-16 mt-0 sm:mt-10'
              />
            </div>
            <div className='flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto'>
              <Button variant='ghost' className='w-full sm:w-auto' onClick={() => router.push('/client/auth')}>
                Client Login
              </Button>
              <Button
                className='bg-black text-white hover:bg-gray-800 w-full sm:w-auto'
                onClick={() => router.push('/practitioner/auth')}
              >
                Practitioner Login
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className='pt-28 pb-16 px-2 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto text-center'>
          <motion.h1
            className='text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight break-words'
            style={{ fontFamily: "'Playfair Display', serif" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Transform Therapeutic
            <span className='block text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-600 to-blue-600'>
              Conversations into
            </span>
            Continuous Support
          </motion.h1>

          <motion.p
            className='text-base sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Empower your practice with AI-assisted tools that help you provide clients with the daily structure and
            guidance they need to thrive.
          </motion.p>

          <motion.div
            className='flex flex-col sm:flex-row gap-4 justify-center items-center w-full'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button
              size='lg'
              className='px-6 py-3 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-black text-white hover:bg-gray-800 w-full sm:w-auto'
              onClick={() => router.push('/practitioner/auth')}
            >
              Start Your Free Trial
              <ArrowRight className='ml-2 w-5 h-5' />
            </Button>
            <Button
              variant='outline'
              size='lg'
              className='px-6 py-3 text-base sm:text-lg font-semibold border-foreground text-foreground hover:bg-accent hover:text-accent-foreground w-full sm:w-auto'
              onClick={() => router.push('/client/auth')}
            >
              Client Access
            </Button>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className='py-16 px-2 sm:px-6 lg:px-8 bg-white/80'>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            className='text-center mb-16'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className='text-3xl sm:text-4xl font-bold text-foreground mb-4 font-didot'>How Continuum Works</h2>
            <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
              A seamless workflow that transforms your sessions into ongoing client support
            </p>
          </motion.div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {[
              {
                step: '01',
                title: 'Conduct Session',
                description: 'Lead your therapy session while our AI transcribes and captures key insights',
              },
              {
                step: '02',
                title: 'Generate Program',
                description: 'AI suggests relevant daily tasks based on your session content',
              },
              {
                step: '03',
                title: 'Curate & Publish',
                description: 'Review, edit, and approve the suggested tasks for your client',
              },
              {
                step: '04',
                title: 'Monitor Progress',
                description: 'Track client engagement and receive real-time feedback through journals',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className='text-center'
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className='w-16 h-16 bg-black rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4'>
                  {item.step}
                </div>
                <h3 className='text-xl font-semibold text-foreground mb-2'>{item.title}</h3>
                <p className='text-muted-foreground'>{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-16 px-2 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            className='text-center mb-16'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className='text-3xl sm:text-4xl font-bold text-foreground mb-4 font-didot'>
              Powerful Features for Modern Practice
            </h2>
            <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
              Everything you need to enhance your therapeutic practice and client outcomes
            </p>
          </motion.div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className='h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm'>
                  <CardHeader className='pb-4'>
                    <div className='w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white mb-4'>
                      {feature.icon}
                    </div>
                    <CardTitle
                      className='text-xl font-semibold text-foreground'
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-0'>
                    <p className='text-muted-foreground leading-relaxed'>{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className='py-16 px-2 sm:px-6 lg:px-8 bg-white/80'>
        <div className='max-w-7xl mx-auto'>
          <motion.div
            className='text-center mb-16'
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className='w-16 h-16 bg-black rounded-full flex items-center justify-center text-white mx-auto mb-6'>
              <ShieldCheck className='w-8 h-8' />
            </div>
            <h2 className='text-3xl sm:text-4xl font-bold text-foreground mb-4 font-didot'>
              Your Trust & Security is Our Priority
            </h2>
            <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
              Built with the highest standards of privacy, security, and ethical AI practices
            </p>
          </motion.div>

          <div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className='border-0 shadow-lg bg-white/90'>
                <CardHeader>
                  <CardTitle
                    className='text-2xl font-bold text-foreground flex items-center gap-3'
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    <Lock className='w-6 h-6 text-foreground' />
                    Complete Control
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground mb-4 leading-relaxed'>
                    You maintain 100% control over all content. Our AI provides suggestions, but nothing is ever sent to
                    your clients without your explicit review and approval.
                  </p>
                  <div className='space-y-2'>
                    {benefits.slice(0, 3).map((benefit, index) => (
                      <div key={index} className='flex items-center gap-3'>
                        <CheckCircle className='w-5 h-5 text-foreground flex-shrink-0' />
                        <span className='text-muted-foreground'>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className='border-0 shadow-lg bg-white/90'>
                <CardHeader>
                  <CardTitle
                    className='text-2xl font-bold text-foreground flex items-center gap-3'
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    <Heart className='w-6 h-6 text-foreground' />
                    Ethical AI Design
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground mb-4 leading-relaxed'>
                    Our AI systems are designed to augment your professional expertise, not replace it. We focus on
                    enhancing your ability to support clients effectively.
                  </p>
                  <div className='space-y-2'>
                    {benefits.slice(3).map((benefit, index) => (
                      <div key={index} className='flex items-center gap-3'>
                        <CheckCircle className='w-5 h-5 text-foreground flex-shrink-0' />
                        <span className='text-muted-foreground'>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-16 px-2 sm:px-6 lg:px-8 bg-black'>
        <div className='max-w-4xl mx-auto text-center'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className='text-3xl sm:text-4xl font-bold text-white mb-4 font-didot'>
              Ready to Transform Your Practice?
            </h2>
            <p className='text-xl text-gray-300 mb-8 max-w-2xl mx-auto'>
              Join thousands of practitioners who are already providing better support to their clients with Continuum.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center w-full'>
              <Button
                size='lg'
                variant='secondary'
                className='px-6 py-3 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-white text-black hover:bg-gray-100 w-full sm:w-auto'
                onClick={() => router.push('/practitioner/auth')}
              >
                Start Free Trial
                <ArrowRight className='ml-2 w-5 h-5' />
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='px-6 py-3 text-base sm:text-lg font-semibold border-white text-white hover:bg-white hover:text-black transition-all duration-300 bg-transparent w-full sm:w-auto'
                onClick={() => router.push('/client/auth')}
              >
                Client Login
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className='py-8 px-2 sm:px-6 lg:px-8 bg-white/80 border-t border-border'>
        <div className='max-w-7xl mx-auto text-center'>
          <div className='flex items-center justify-center mb-4'>
            <Image src='/logo.svg' alt='Continuum' width={24} height={24} className='w-6 h-6' />
          </div>
          <p className='text-muted-foreground text-xs sm:text-sm break-words'>
            © 2025 Continuum. Empowering therapeutic practices with AI-assisted tools.
          </p>
        </div>
      </footer>
    </div>
  );
}

'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { AuthDialog } from './AuthDialog';

const ContinuumLanding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const howItWorksRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: howItWorksRef,
    offset: ['start end', 'end start'],
  });

  const steps = [
    {
      number: 1,
      title: 'Session',
      description:
        'Run your session as normal. Using AI, Continuum captures and structures key insights — no extra admin needed',
      bgColor: 'bg-pink-100',
      video: '/landingpage/step1.mp4',
    },
    {
      number: 2,
      title: 'Plan',
      description:
        'AI drafts a personalised programme based on verbatim tasks and suggested tasks. These tasks then include potential actions, reflections, and resources. You edit or approve with one click.',
      bgColor: 'bg-pink-200',
      video: '/landingpage/step2.mp4',
    },
    {
      number: 3,
      title: 'Engage',
      description:
        'Clients get their plan via an app, showing up in a daily format — They can tick off tasks, journal and give feedback. You can communicate with your clients any time via secure in app messaging.',
      bgColor: 'bg-blue-100',
      video: '/landingpage/step3.mp4',
    },
    {
      number: 4,
      title: 'Track',
      description:
        "Get real-time visibility into client progress, plus weekly summaries before each session — so you know exactly what's working and what's not.",
      bgColor: 'bg-purple-100',
      video: '/landingpage/step4.mp4',
    },
  ];

  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((latest) => {
      const progress = latest;
      const stepIndex = Math.min(Math.floor(progress * steps.length * 1.2), steps.length - 1);
      setCurrentStep(Math.max(0, stepIndex));
    });

    return () => unsubscribe();
  }, [scrollYProgress, steps.length]);

  const currentStepData = steps[currentStep];

  return (
    <div className='min-h-screen bg-white'>
      {/* Header - Fixed with Proper Backdrop Blur */}
      <header
        className='fixed top-0 left-0 right-0 z-50 border-b border-white/20 shadow-lg'
        style={{
          backdropFilter: 'blur(15px) saturate(180%)',
          WebkitBackdropFilter: 'blur(15px) saturate(180%)',
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
        }}
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center'>
          <div className='flex items-center space-x-2'>
            <div className='flex items-center justify-center'>
              <Image
                src='/landingpage/infinity.svg'
                alt='Infinity'
                width={32}
                height={32}
                className='w-6 h-6 sm:w-8 sm:h-8'
              />
            </div>
            <Image
              src='/landingpage/continuum.svg'
              alt='Continuum'
              width={120}
              height={24}
              className='h-4 w-auto sm:h-6'
            />
          </div>
          <div className='flex items-center space-x-2 sm:space-x-4 md:space-x-6'>
            <button className='text-white hover:text-gray-300 transition-colors font-medium text-sm sm:text-base hidden sm:block'>
              Contact Us
            </button>
            <button
              onClick={() => setIsAuthDialogOpen(true)}
              className='px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors font-medium text-sm sm:text-base'
            >
              Sign In
            </button>
            <button
              onClick={() => setIsAuthDialogOpen(true)}
              className='px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 text-white rounded-lg transition-all duration-500 ease-in-out font-medium text-sm sm:text-base hover:scale-105'
              style={{
                background: 'linear-gradient(to right, #A5B7C8 0%, #E9ADA3 50%, #C87F94 100%)',
                transition: 'all 0.5s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #C87F94 0%, #E9ADA3 50%, #A5B7C8 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #A5B7C8 0%, #E9ADA3 50%, #C87F94 100%)';
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className='min-h-screen pt-16 sm:pt-20 pb-8 sm:pb-16 px-4 sm:px-6 relative overflow-hidden'>
        {/* Background Image */}
        <div className='absolute inset-0 z-0'>
          <Image src='/landingpage/placeholder1.jpg' alt='Background' fill className='object-cover' priority />
          <div className='absolute inset-0 bg-black/40'></div>
        </div>

        <div className='relative z-10 max-w-7xl mx-auto h-screen flex items-center xl:justify-start 2xl:justify-start'>
          <div className='max-w-2xl w-full text-left xl:ml-8 2xl:ml-16'>
            <h1
              className='text-4xl sm:text-[40px] md:text-[50px] lg:text-[64px] font-bold text-white leading-tight mb-6 sm:mb-8'
              style={{ fontFamily: 'DM Serif Display, serif' }}
            >
              Where Therapy &<br />
              Coaching Becomes
              <br />
              Action & Accountability
            </h1>
            <p className='text-lg sm:text-xl text-white/90 leading-relaxed mb-6 sm:mb-8'>
              Transform every session into actionable steps that
              <br className='hidden sm:block' />
              keep clients progressing between meetings.
            </p>
            <button
              onClick={() => setIsAuthDialogOpen(true)}
              className='px-6 py-3 sm:px-8 sm:py-4 text-white rounded-lg text-base sm:text-lg font-semibold transition-all duration-500 ease-in-out hover:scale-105'
              style={{
                background: 'linear-gradient(to right, #A5B7C8 0%, #E9ADA3 50%, #C87F94 100%)',
                transition: 'all 0.5s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #C87F94 0%, #E9ADA3 50%, #A5B7C8 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #A5B7C8 0%, #E9ADA3 50%, #C87F94 100%)';
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className='py-0 bg-white'>
        <div className='grid lg:grid-cols-2 min-h-screen'>
          {/* Left Content */}
          <div className='flex items-center justify-center p-6 sm:p-8 lg:p-12 xl:p-20 order-2 lg:order-1'>
            <div className='max-w-lg'>
              <h2 className='text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 sm:mb-8'>What We Do</h2>
              <p className='text-base sm:text-lg text-gray-700 leading-relaxed'>
                Continuum is a practitioner-first platform that turns conversations into notes into action. Using
                secure, AI-assisted tools, we help therapists and coaches create personalised daily programmes — so
                clients stay supported, engaged, and moving forward between sessions.
              </p>
            </div>
          </div>

          {/* Right Image */}
          <div className='relative min-h-[50vh] lg:min-h-screen order-1 lg:order-2'>
            <Image
              src='/landingpage/placeholder2.svg'
              alt='Smiling blonde woman therapist'
              fill
              className='object-cover'
            />
          </div>
        </div>
      </section>

      {/* How It Works - Vertical Flow Section */}
      <section
        ref={howItWorksRef}
        className='relative'
        style={{ height: '500vh' }} // 5x viewport height for smooth scrolling
      >
        <div className='sticky top-0 h-screen flex items-center justify-center overflow-hidden'>
          <div className='w-full h-full'>
            {/* Section Header - only show initially */}
            <div className='absolute top-8 sm:top-12 lg:top-20 left-0 right-0 text-center z-20 px-4'>
              <h2 className='text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 sm:mb-4'>How It Works</h2>
              <p className='text-lg sm:text-xl text-gray-600'>Four simple steps to transform your practice</p>
            </div>

            <AnimatePresence mode='wait'>
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -100 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className={`w-full h-full ${currentStepData?.bgColor || 'bg-pink-100'} relative`}
              >
                {/* Large Step Number Background */}
                <div className='absolute left-4 sm:left-8 lg:left-20 top-1/2 transform -translate-y-1/2 z-0'>
                  <span className='text-8xl sm:text-12xl md:text-16xl lg:text-[20rem] font-bold text-white/20 select-none'>
                    {currentStepData?.number || 1}
                  </span>
                </div>

                <div className='relative h-full flex items-center justify-center'>
                  {/* Large Video - Fixed size 825x490px, responsive */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className='relative mx-auto px-4 sm:px-8 lg:px-20'
                  >
                    <div
                      style={{
                        width: 'min(825px, 90vw)',
                        height: 'min(490px, 50vw)',
                        maxWidth: '100%',
                        maxHeight: '60vh',
                        position: 'relative',
                      }}
                      className='rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex items-center justify-center bg-black'
                    >
                      <video
                        src={currentStepData?.video || '/landingpage/step1.mp4'}
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    {/* Content Card - Positioned over video like in screenshots */}
                    <motion.div
                      className='absolute bottom-4 right-4 sm:bottom-8 sm:right-8 max-w-xs sm:max-w-sm bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl'
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                    >
                      <div className='flex items-center space-x-3 mb-3 sm:mb-4'>
                        <div className='w-8 h-8 sm:w-10 sm:h-10 bg-pink-400 rounded-lg flex items-center justify-center'>
                          <span className='text-white text-sm sm:text-lg font-bold'>
                            {currentStepData?.number || 1}
                          </span>
                        </div>
                        <h3 className='text-lg sm:text-xl font-bold text-gray-900'>
                          {currentStepData?.title || 'Session'}
                        </h3>
                      </div>
                      <p className='text-xs sm:text-sm text-gray-700 leading-relaxed'>
                        {currentStepData?.description || ''}
                      </p>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress indicator */}
        <div className='fixed right-4 sm:right-8 top-1/2 transform -translate-y-1/2 z-30'>
          <div className='flex flex-col space-y-2 sm:space-y-3'>
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
                  index === currentStep ? 'bg-pink-400 scale-125' : 'bg-white/50 border-2 border-pink-400'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-pink-50'>
        <div className='max-w-4xl mx-auto text-center space-y-6 sm:space-y-8'>
          <h2 className='text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900'>
            Ready to transform
            <br />
            your practice?
          </h2>
          <p className='text-lg sm:text-xl text-gray-600'>
            Click Get Started to sign up now, or contact us for
            <br className='hidden sm:block' />
            more information.
          </p>
          <div className='flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4'>
            <button
              onClick={() => setIsAuthDialogOpen(true)}
              className='px-6 py-3 sm:px-8 sm:py-4 text-white rounded-lg text-base sm:text-lg font-semibold transition-all duration-500 ease-in-out hover:scale-105'
              style={{
                background: 'linear-gradient(to right, #A5B7C8 0%, #E9ADA3 50%, #C87F94 100%)',
                transition: 'all 0.5s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #C87F94 0%, #E9ADA3 50%, #A5B7C8 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #A5B7C8 0%, #E9ADA3 50%, #C87F94 100%)';
              }}
            >
              Get Started
            </button>
            <button className='px-6 py-3 sm:px-8 sm:py-4 border-2 border-gray-300 text-gray-700 rounded-lg text-base sm:text-lg font-semibold hover:bg-gray-50 transition-colors'>
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* Final Section */}
      <section className='py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-white'>
        <div className='max-w-4xl mx-auto text-center space-y-6 sm:space-y-8'>
          <h2 className='text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900'>
            Solving the Biggest Gaps
            <br />
            in Coaching & Therapy
          </h2>
          <p className='text-lg sm:text-xl text-gray-600'>
            Purpose-built tools that address real practitioner challenges
          </p>
        </div>
      </section>

      {/* Auth Dialog */}
      <AuthDialog isOpen={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} />
    </div>
  );
};

export default ContinuumLanding;

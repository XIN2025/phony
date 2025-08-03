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
      bgColor: 'bg-[#F2CEC8]',
      video: '/landingpage/step1.mp4',
    },
    {
      number: 2,
      title: 'Plan',
      description:
        'AI drafts a personalised programme based on verbatim tasks and suggested tasks. These tasks then include potential actions, reflections, and resources. You edit or approve with one click.',
      bgColor: 'bg-[#DEB2BF]',
      video: '/landingpage/step2.mp4',
    },
    {
      number: 3,
      title: 'Engage',
      description:
        'Clients get their plan via an app, showing up in a daily format — They can tick off tasks, journal and give feedback. You can communicate with your clients any time via secure in app messaging.',
      bgColor: 'bg-[#C9D4DE]',
      video: '/landingpage/step3.mp4',
    },
    {
      number: 4,
      title: 'Track',
      description:
        "Get real-time visibility into client progress, plus weekly summaries before each session — so you know exactly what's working and what's not.",
      bgColor: 'bg-[#BAB2DE]',
      video: '/landingpage/step4.mp4',
    },
  ];

  const gapsData = [
    {
      title: 'Effortless Notes',
      description: 'AI-assisted note-taking means you focus on your client - not your keyboard.',
      image: '/landingpage/transform-section/Effortless-notes.svg',
      color: 'bg-[#F6DEDA]',
      borderColor: 'border-pink-200',
    },
    {
      title: 'Daily Client Support',
      description: 'Personalised, simple programmes to keep clients engaged and aligned with their goals.',
      image: '/landingpage/transform-section/Daily-client-support.svg',
      color: 'bg-[#DBE2E9]',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Progress Visibility',
      description: "See what's getting done and what's falling behind - in one smart dashboard.",
      image: '/landingpage/transform-section/Progress-visibility.svg',
      color: 'bg-[#F6DEDA]',
      borderColor: 'border-pink-200',
    },
    {
      title: 'One Secure Inbox',
      description: 'Keep all client conversations in one encrypted, private space - no more scattered messages.',
      image: '/landingpage/transform-section/One-secure-inbox.svg',
      color: 'bg-[#DBE2E9]',
      borderColor: 'border-blue-200',
    },
  ];

  const trustData = [
    {
      title: "You're In Control",
      description: 'Nothing gets sent to clients without your approval',
      image: '/landingpage/buiild-on-trust/control.svg',
      color: 'bg-pink-100',
    },
    {
      title: 'Privacy-First',
      description: 'All data is encrypted and secured to the highest standard',
      image: '/landingpage/buiild-on-trust/privacy.svg',
      color: 'bg-blue-100',
    },
    {
      title: 'AI That Supports',
      description: 'Continuum enhances & elevates what you do, but critically does not replace you',
      image: '/landingpage/buiild-on-trust/suuport.svg',
      color: 'bg-pink-100',
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
        className='fixed top-0 left-0 right-0 z-50 shadow-lg'
        style={{
          backdropFilter: 'blur(15px) saturate(180%)',
          WebkitBackdropFilter: 'blur(15px) saturate(180%)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <div className='max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 flex justify-between items-center'>
          <div className='flex items-center space-x-1 sm:space-x-2'>
            <div className='flex items-center justify-center'>
              <Image
                src='/landingpage/infinity.svg'
                alt='Infinity'
                width={32}
                height={12}
                className='w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12'
                style={{
                  width: 'clamp(20px, 4vw, 48px)',
                  height: 'clamp(20px, 4vw, 48px)',
                }}
              />
            </div>
            <Image
              src='/landingpage/continuum.svg'
              alt='Continuum'
              width={32}
              height={24}
              className='h-3 w-auto '
              style={{
                height: 'clamp(8px, 3vw, 16px)',
                width: 'auto',
              }}
            />
          </div>
          <div className='flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4 xl:space-x-6'>
            <button className='text-white hover:text-gray-300 transition-colors font-medium text-xs sm:text-sm md:text-base hidden lg:block'>
              Contact Us
            </button>
            <button
              onClick={() => setIsAuthDialogOpen(true)}
              className='px-1.5 py-1 sm:px-2 sm:py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2 xl:px-6 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors font-medium text-xs sm:text-sm md:text-base'
            >
              Sign In
            </button>
            <button
              onClick={() => setIsAuthDialogOpen(true)}
              className='px-1.5 py-1 sm:px-2 sm:py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2 xl:px-6 text-white rounded-lg transition-all duration-500 ease-in-out font-medium text-xs sm:text-sm md:text-base hover:scale-105'
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
      <section className='relative overflow-hidden' style={{ height: '90vh', paddingTop: '80px' }}>
        {/* Background Image */}
        <div className='absolute inset-0 z-0'>
          <Image
            src='/landingpage/placeholder1.jpg'
            alt='Background'
            fill
            className='object-cover object-center'
            priority
            style={{ objectPosition: 'center 30%' }}
          />
          <div className='absolute inset-0 bg-black/40'></div>
        </div>

        <div className='relative z-10 max-w-7xl mx-auto -mt-15 h-screen flex items-center px-4 sm:px-6 lg:px-8'>
          <div className='max-w-2xl w-full text-left'>
            <h1
              className='font-bold text-white leading-tight mb-6 sm:mb-8'
              style={{
                fontFamily: 'DM Serif Display, serif',
                fontSize: 'min(8vw, 64px)',
                lineHeight: '1.1',
              }}
            >
              Where Therapy &<br />
              Coaching Becomes
              <br />
              Action & Accountability
            </h1>
            <p className='text-white/90 leading-relaxed mb-6 sm:mb-8' style={{ fontSize: 'min(3.5vw, 24px)' }}>
              Transform every session into actionable steps that
              <br className='hidden sm:block' />
              keep clients progressing between meetings.
            </p>
            <button
              onClick={() => setIsAuthDialogOpen(true)}
              className='text-white rounded-lg font-semibold transition-all duration-500 ease-in-out hover:scale-105 px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4'
              style={{
                background: 'linear-gradient(to right, #A5B7C8 0%, #E9ADA3 50%, #C87F94 100%)',
                transition: 'all 0.5s ease-in-out',
                fontSize: 'min(3vw, 20px)',
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
        <div className='grid lg:grid-cols-2' style={{ minHeight: '100vh' }}>
          {/* Left Content */}
          <div
            className='flex items-center justify-center order-2 lg:order-1 px-4 sm:px-6 lg:px-8'
            style={{ padding: 'min(5vw, 80px)' }}
          >
            <div className='w-full' style={{ maxWidth: '500px' }}>
              <h2
                className='font-bold text-gray-900 mb-6 sm:mb-8'
                style={{ fontSize: 'min(6vw, 60px)', fontFamily: "'DM Serif Display', serif" }}
              >
                What We Do
              </h2>
              <div
                className='rounded-2xl p-6 sm:p-8 shadow-sm'
                style={{
                  background:
                    'linear-gradient(to right, rgba(200, 127, 148, 0.15) 0%, rgba(233, 173, 163, 0.15) 50%, rgba(165, 183, 200, 0.15) 100%)',
                }}
              >
                <p className='text-gray-700 leading-relaxed' style={{ fontSize: 'min(3.5vw, 18px)' }}>
                  Continuum is a practitioner-first platform that turns conversations into notes into action. Using
                  secure, AI-assisted tools, we help therapists and coaches create personalised daily programmes — so
                  clients stay supported, engaged, and moving forward between sessions.
                </p>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className='relative order-1 lg:order-2' style={{ minHeight: '50vh' }}>
            <Image
              src='/landingpage/placeholder2.svg'
              alt='Smiling blonde woman therapist'
              fill
              className='object-cover object-center'
              style={{ objectPosition: 'center 20%' }}
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
            <div className='absolute top-4 sm:top-8 md:top-12 lg:top-20 left-0 right-0 text-center z-20 px-4'>
              <h2
                className='text-2xl sm:text-3xl md:text-[46px] lg:text-[56px] font-bold text-gray-900 mb-2 sm:mb-4'
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                How It Works
              </h2>
              <p className='text-base sm:text-lg md:text-xl text-gray-600'>
                Four simple steps to transform your practice
              </p>
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
                <div className='relative h-full flex items-center justify-center'>
                  {/* Large Video - Fixed size 825x490px, responsive */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className='relative mx-auto px-4 sm:px-8 lg:px-20 flex items-center justify-center'
                  >
                    <div className='relative flex items-center justify-center w-full h-full'>
                      {/* STEP NUMBER - OVERLAPPING LEFT OF VIDEO */}
                      <div
                        className={`absolute top-3 pointer-events-none ${currentStepData?.number === 1 ? '-left-8 sm:-left-12 md:-left-18' : '-left-12 sm:-left-18 md:-left-26'}`}
                      >
                        <span
                          className='text-4xl sm:text-6xl md:text-8xl lg:text-10xl xl:text-[240px] 
        font-bold text-[#80717133] select-none leading-none block text-left'
                        >
                          {currentStepData?.number || 1}
                        </span>
                      </div>
                      {/* VIDEO + OVERLAY */}
                      <div
                        style={{
                          width: 'min(825px, 90vw)',
                          height: 'min(490px, 50vw)',
                          maxWidth: '100%',
                          maxHeight: '60vh',
                          position: 'relative',
                        }}
                        className='rounded-2xl sm:rounded-3xl shadow-2xl overflow-visible flex items-center justify-center bg-black z-10'
                      >
                        <video
                          src={currentStepData?.video || '/landingpage/step1.mp4'}
                          autoPlay
                          loop
                          muted
                          playsInline
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {/* Card overlays video - positioned at top left */}
                        <motion.div
                          className='absolute -bottom-4 -right-4 sm:-bottom-8 sm:-right-8 md:-bottom-12 md:-right-8 max-w-[280px] sm:max-w-xs md:max-w-sm 
                   bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-xl z-90'
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.8, delay: 0.6 }}
                        >
                          <div className='flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3 md:mb-4'>
                            <div className='w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center'>
                              <Image
                                src={`/landingpage/how-it-works/${currentStepData?.number || 1}.svg`}
                                alt={`Step ${currentStepData?.number || 1}`}
                                width={32}
                                height={32}
                                className='w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8'
                              />
                            </div>
                            <h3 className='text-sm sm:text-lg md:text-xl font-bold text-gray-900'>
                              {currentStepData?.title || 'Session'}
                            </h3>
                          </div>
                          <p className='text-xs sm:text-sm text-gray-700 leading-relaxed'>
                            {currentStepData?.description || ''}
                          </p>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-4 md:py-10  px-4 sm:px-6 bg-white rounded-lg mx-2 sm:mx-4 md:mx-6'>
        <div className='max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 md:space-y-8'>
          <h2
            className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900'
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Ready to transform
            <br />
            your practice?
          </h2>
          <p className='text-base sm:text-lg md:text-xl text-gray-600'>
            Click Get Started to sign up now, or contact us for
            <br className='hidden sm:block' />
            more information.
          </p>
          <div className='flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4'>
            <button
              onClick={() => setIsAuthDialogOpen(true)}
              className='px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 text-white rounded-lg text-sm sm:text-base md:text-lg font-semibold transition-all duration-500 ease-in-out hover:scale-105'
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
            <button className='px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 border-2 border-pink-300 text-pink-600 rounded-lg text-sm sm:text-base md:text-lg font-semibold hover:bg-pink-50 transition-colors'>
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* Solving the Biggest Gaps Section */}
      <section className='py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 bg-white'>
        <div className='max-w-7xl mx-auto'>
          {/* Section Header */}
          <div className='text-center mb-8 sm:mb-12 md:mb-16 lg:mb-20'>
            <h2
              className='font-bold text-gray-900 mb-4 sm:mb-6'
              style={{
                fontFamily: 'DM Serif Display, serif',
                fontSize: 'min(6vw, 60px)',
                lineHeight: '1.1',
              }}
            >
              Solving the Biggest Gaps
              <br />
              in Coaching & Therapy
            </h2>
            <p className='text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto'>
              Purpose-built tools that address real practitioner challenges
            </p>
          </div>

          {/* Gaps Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8'>
            {gapsData.map((gap, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`py-8 sm:py-12 md:py-16 px-6 sm:px-8 md:px-12 rounded-2xl ${gap.color} hover:shadow-lg transition-all duration-500 ease-in-out group`}
                style={{
                  borderRadius: '1rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderTopLeftRadius = '15rem';
                  e.currentTarget.style.borderTopRightRadius = '15rem';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderTopLeftRadius = '1rem';
                  e.currentTarget.style.borderTopRightRadius = '1rem';
                }}
              >
                <div className='flex flex-col items-center text-center space-y-1'>
                  <div className='w-auto h-24 sm:h-28 md:h-32 rounded-full flex items-center justify-center shadow-sm border-2 border-gray-200'>
                    <Image
                      src={gap.image}
                      alt={gap.title}
                      width={24}
                      height={24}
                      className='w-auto h-16 sm:h-20 md:h-24'
                    />
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-bold text-gray-900 text-base sm:text-lg md:text-xl mb-2 sm:mb-3'>
                      {gap.title}
                    </h3>
                    <p className='text-gray-700 leading-relaxed text-xs sm:text-sm'>{gap.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className=' mx-4 sm:mx-6'></div>

      {/* Built on Trust Section */}
      <section
        className='py-8 sm:py-12 md:py-16 px-4 sm:px-6'
        style={{
          background:
            'radial-gradient(ellipse at 30% 50%, rgba(200, 127, 148, 0.25) 0%, rgba(233, 173, 163, 0.2) 40%, rgba(165, 183, 200, 0.1) 70%, rgba(165, 183, 200, 0.2) 100%)',
        }}
      >
        <div className='max-w-7xl mx-auto'>
          {/* Section Header */}
          <div className='text-center mb-6 sm:mb-12 md:mb-16 lg:mb-20'>
            <h2
              className='font-bold text-gray-900 mb-4 sm:mb-6'
              style={{
                fontFamily: 'DM Serif Display, serif',
                fontSize: 'min(6vw, 60px)',
                lineHeight: '1.1',
              }}
            >
              Built on Trust
            </h2>
            <p className='text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto'>
              Security, privacy and practitioner autonomy at our core
            </p>
          </div>

          {/* Trust Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8'>
            {trustData.map((trust, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className='p-4 sm:p-6 rounded-2xl hover:shadow-lg transition-all duration-300'
              >
                <div className='flex flex-col items-center text-center space-y-3 max-w-xs'>
                  <div className='w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-sm bg-pink-100'>
                    <Image
                      src={trust.image}
                      alt={trust.title}
                      width={48}
                      height={48}
                      className='w-6 h-6 sm:w-8 sm:h-8'
                    />
                  </div>
                  <div>
                    <h3 className='font-bold text-gray-900 text-sm sm:text-base md:text-lg mb-2'>{trust.title}</h3>
                    <p className='text-gray-700 leading-relaxed text-xs sm:text-sm'>{trust.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className='py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 bg-gray-100'>
        <div className='max-w-4xl mx-auto'>
          {/* Section Header */}
          <div className='text-center mb-8 sm:mb-12 md:mb-16'>
            <h2
              className='font-bold text-gray-900 mb-4 sm:mb-6'
              style={{
                fontFamily: 'DM Serif Display, serif',
                fontSize: 'min(8vw, 56px)',
                lineHeight: '1.1',
              }}
            >
              Contact Us
            </h2>
            <p
              className='text-base sm:text-lg md:text-[32px] text-gray-600 mb-2 italic'
              style={{
                fontFamily: 'DM Serif Text, serif',
                lineHeight: '1.1',
              }}
            >
              We'd love to hear from you.
            </p>
            <p className='text-sm sm:text-base text-gray-600'>Leave a message, request a callback or give feedback.</p>
          </div>

          {/* Contact Form */}
          <form className='space-y-4 sm:space-y-6'>
            {/* First Row - Name Fields */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'>
              <div>
                <label htmlFor='firstName' className='block text-sm font-medium text-gray-700 mb-2'>
                  First Name
                </label>
                <input
                  type='text'
                  id='firstName'
                  name='firstName'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
                  placeholder='Enter your first name'
                />
              </div>
              <div>
                <label htmlFor='lastName' className='block text-sm font-medium text-gray-700 mb-2'>
                  Last Name
                </label>
                <input
                  type='text'
                  id='lastName'
                  name='lastName'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
                  placeholder='Enter your last name'
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
                Email
              </label>
              <input
                type='email'
                id='email'
                name='email'
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
                placeholder='Share your thoughts, suggestions, or feature requests...'
              />
            </div>

            {/* Phone Number Field */}
            <div>
              <label htmlFor='phone' className='block text-sm font-medium text-gray-700 mb-2'>
                Phone Number
              </label>
              <div className='flex'>
                <select className='px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'>
                  <option>UK</option>
                  <option>US</option>
                  <option>CA</option>
                </select>
                <input
                  type='tel'
                  id='phone'
                  name='phone'
                  className='flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
                  placeholder='+44 9876543210'
                />
              </div>
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor='message' className='block text-sm font-medium text-gray-700 mb-2'>
                Message
              </label>
              <textarea
                id='message'
                name='message'
                rows={4}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white'
                placeholder='Leave us a message or a suggestion'
              />
            </div>

            {/* Submit Button */}
            <div className='text-center'>
              <button
                type='submit'
                className='px-6 py-3 sm:px-8 sm:py-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-300 text-sm sm:text-base'
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className='relative text-white bg-black py-8 sm:py-10 md:py-15 px-4 sm:px-6 lg:px-8 overflow-hidden'>
        <div
          className='absolute bottom-0 right-0 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] md:w-[800px] md:h-[800px] pointer-events-none'
          style={{
            background:
              'radial-gradient(ellipse at bottom right, rgba(200, 127, 148, 0.5) 0%, rgba(200, 127, 148, 0.3) 20%, rgba(200, 127, 148, 0.15) 45%, rgba(200, 127, 148, 0.06) 70%, transparent 95%)',
          }}
        />

        {/* Background Infinity Symbol */}
        <div className='absolute -bottom-8 -right-10 sm:-bottom-14 sm:-right-20 opacity-80 pointer-events-none transform'>
          <Image
            src='/landingpage/infinity.svg'
            alt='Background Infinity'
            width={200}
            height={200}
            className='w-auto h-[80px] sm:h-[120px] md:h-[150px]'
          />
        </div>

        <div className='max-w-7xl mx-auto relative z-10'>
          {/* Top Section */}
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 space-y-4 sm:space-y-0'>
            {/* Left Side - Logo, Company Name, and Contact Info */}
            <div className='flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-8'>
              {/* Logo Section */}
              <div className='flex flex-col items-start'>
                <Image
                  src='/landingpage/infinity.svg'
                  alt='Infinity'
                  width={32}
                  height={32}
                  className='w-auto h-4 sm:h-5 mb-2'
                />
                <Image
                  src='/landingpage/continuum.svg'
                  alt='Continuum'
                  width={64}
                  height={64}
                  className='w-auto h-4 sm:h-5 mb-2'
                />
              </div>

              {/* Contact Information */}
              <div className='space-y-2 sm:space-y-3'>
                <div className='text-white'>
                  <p className='text-sm sm:text-base'>123 Street, ABC, CF, USA, 000000</p>
                  <div className='w-full h-px bg-white mt-2'></div>
                </div>
                <div className='flex items-center space-x-2 text-white'>
                  <svg className='w-3 h-3 sm:w-4 sm:h-4' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z' />
                  </svg>
                  <span className='text-sm sm:text-base'>info@continuum.com</span>
                </div>
                <div className='flex items-center space-x-2 text-white'>
                  <svg className='w-3 h-3 sm:w-4 sm:h-4' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z' />
                  </svg>
                  <span className='text-sm sm:text-base'>+011234567890</span>
                </div>
              </div>
            </div>

            {/* Right Side - Social Media Icons */}
            <div className='flex space-x-3 sm:space-x-4'>
              <button className='w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-white flex items-center justify-center text-white hover:bg-white hover:text-gray-900 transition-colors'>
                <svg className='w-3 h-3 sm:w-4 sm:h-4' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                </svg>
              </button>
              <button className='w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-white flex items-center justify-center text-white hover:bg-white hover:text-gray-900 transition-colors'>
                <svg className='w-3 h-3 sm:w-4 sm:h-4' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' />
                </svg>
              </button>
              <button className='w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-white flex items-center justify-center text-white hover:bg-white hover:text-gray-900 transition-colors'>
                <svg className='w-3 h-3 sm:w-4 sm:h-4' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z' />
                </svg>
              </button>
              <button className='w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-white flex items-center justify-center text-white hover:bg-white hover:text-gray-900 transition-colors'>
                <svg className='w-3 h-3 sm:w-4 sm:h-4' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' />
                </svg>
              </button>
            </div>
          </div>

          {/* Horizontal Line */}
          <div className='w-full h-px bg-white mb-6 sm:mb-8'></div>

          {/* Bottom Section */}
          <div className='flex justify-center sm:justify-end mb-8 sm:mb-10 items-center'>
            {/* Copyright */}
            <div>
              <p className='text-white text-xs sm:text-sm'>Continuum © 2025 All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Dialog */}
      <AuthDialog isOpen={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} />
    </div>
  );
};

export default ContinuumLanding;

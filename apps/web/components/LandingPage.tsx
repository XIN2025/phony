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
      icon: '👥',
      color: 'bg-pink-100',
    },
    {
      title: 'Privacy-First',
      description: 'All data is encrypted and secured to the highest standard',
      icon: '🔒',
      color: 'bg-blue-100',
    },
    {
      title: 'AI That Supports',
      description: 'Continuum enhances & elevates what you do, but critically does not replace you',
      icon: '🤝',
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
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-3  flex justify-between items-center'>
          <div className='flex items-center  space-x-2'>
            <div className='flex items-center justify-center'>
              <Image
                src='/landingpage/infinity.svg'
                alt='Infinity'
                width={32}
                height={32}
                className='w-6 h-6 sm:w-15 sm:h-15'
              />
            </div>
            <Image
              src='/landingpage/continuum.svg'
              alt='Continuum'
              width={120}
              height={24}
              className='h-4 w-auto sm:h-5'
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

        <div
          className='relative z-10 max-w-7xl mx-auto h-screen flex items-center'
          style={{ paddingLeft: 'min(8vw, 120px)' }}
        >
          <div className='max-w-2xl w-full text-left'>
            <h1
              className='font-bold text-white leading-tight mb-8'
              style={{
                fontFamily: 'DM Serif Display, serif',
                fontSize: 'min(5vw, 80px)',
                lineHeight: '1.1',
              }}
            >
              Where Therapy &<br />
              Coaching Becomes
              <br />
              Action & Accountability
            </h1>
            <p className='text-white/90 leading-relaxed mb-8' style={{ fontSize: 'min(1.5vw, 24px)' }}>
              Transform every session into actionable steps that
              <br className='hidden sm:block' />
              keep clients progressing between meetings.
            </p>
            <button
              onClick={() => setIsAuthDialogOpen(true)}
              className='text-white rounded-lg font-semibold transition-all duration-500 ease-in-out hover:scale-105'
              style={{
                background: 'linear-gradient(to right, #A5B7C8 0%, #E9ADA3 50%, #C87F94 100%)',
                transition: 'all 0.5s ease-in-out',
                padding: '16px 32px',
                fontSize: 'min(1.2vw, 20px)',
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
          <div className='flex items-center justify-center order-2 lg:order-1' style={{ padding: 'min(5vw, 80px)' }}>
            <div style={{ maxWidth: '500px' }}>
              <h2
                className='font-bold text-gray-900 mb-8'
                style={{ fontSize: 'min(4vw, 60px)', fontFamily: "'DM Serif Display', serif" }}
              >
                What We Do
              </h2>
              <p className='text-gray-700 leading-relaxed' style={{ fontSize: 'min(1.2vw, 18px)' }}>
                Continuum is a practitioner-first platform that turns conversations into notes into action. Using
                secure, AI-assisted tools, we help therapists and coaches create personalised daily programmes — so
                clients stay supported, engaged, and moving forward between sessions.
              </p>
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
            <div className='absolute top-8 sm:top-12 lg:top-20 left-0 right-0 text-center z-20 px-4'>
              <h2
                className='text-3xl sm:text-[46px] md:text-[56px] font-bold text-gray-900 mb-2 sm:mb-4'
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                How It Works
              </h2>
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
                      <div className='absolute z-20 top-1/2 left-0 -translate-y-1/2 -translate-x-1/3 pointer-events-none'>
                        <span
                          className='text-8xl sm:text-10xl md:text-12xl lg:text-16xl xl:text-[20rem]
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
                        className='rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex items-center justify-center bg-black z-10'
                      >
                        <video
                          src={currentStepData?.video || '/landingpage/step1.mp4'}
                          autoPlay
                          loop
                          muted
                          playsInline
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {/* Card overlays video as before */}
                        <motion.div
                          className='absolute bottom-4 right-4 sm:bottom-8 sm:right-8 max-w-xs sm:max-w-sm 
                   bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl z-30'
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
      <section className='py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-white   rounded-lg mx-4 sm:mx-6'>
        <div className='max-w-4xl mx-auto text-center space-y-6 sm:space-y-8'>
          <h2
            className='text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900'
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
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
            <button className='px-6 py-3 sm:px-8 sm:py-4 border-2 border-pink-300 text-pink-600 rounded-lg text-base sm:text-lg font-semibold hover:bg-pink-50 transition-colors'>
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* Solving the Biggest Gaps Section */}
      <section className='py-16 sm:py-20 lg:py-24 px-4 sm:px-6 bg-white'>
        <div className='max-w-7xl mx-auto'>
          {/* Section Header */}
          <div className='text-center mb-12 sm:mb-16 lg:mb-20'>
            <h2
              className='font-bold text-gray-900 mb-4 sm:mb-6'
              style={{
                fontFamily: 'DM Serif Display, serif',
                fontSize: 'min(4vw, 60px)',
                lineHeight: '1.1',
              }}
            >
              Solving the Biggest Gaps
              <br />
              in Coaching & Therapy
            </h2>
            <p className='text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto'>
              Purpose-built tools that address real practitioner challenges
            </p>
          </div>

          {/* Gaps Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8'>
            {gapsData.map((gap, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`p-6 sm:p-8 rounded-2xl border-2 ${gap.borderColor} ${gap.color} hover:shadow-lg transition-all duration-300`}
              >
                <div className='flex flex-col items-center text-center space-y-4'>
                  <div className='w-auto h-32 rounded-full  flex items-center justify-center shadow-sm border-2 border-gray-200'>
                    <Image src={gap.image} alt={gap.title} width={32} height={32} className='w-auto h-32' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-bold text-gray-900 text-lg sm:text-xl mb-3'>{gap.title}</h3>
                    <p className='text-gray-700 leading-relaxed text-sm sm:text-base'>{gap.description}</p>
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
        className='py-16 sm:py-20 lg:py-24 px-4 sm:px-6'
        style={{
          background:
            'radial-gradient(ellipse at 30% 50%, rgba(200, 127, 148, 0.4) 0%, rgba(233, 173, 163, 0.3) 40%, rgba(165, 183, 200, 0.2) 70%, rgba(165, 183, 200, 0.4) 100%)',
        }}
      >
        <div className='max-w-7xl mx-auto'>
          {/* Section Header */}
          <div className='text-center mb-12 sm:mb-16 lg:mb-20'>
            <h2
              className='font-bold text-gray-900 mb-4 sm:mb-6'
              style={{
                fontFamily: 'DM Serif Display, serif',
                fontSize: 'min(4vw, 60px)',
                lineHeight: '1.1',
              }}
            >
              Built on Trust
            </h2>
            <p className='text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto'>
              Security, privacy and practitioner autonomy at our core
            </p>
          </div>

          {/* Trust Grid */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8'>
            {trustData.map((trust, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className='p-6 sm:p-8 rounded-2xl bg-white border-2 border-gray-100 hover:shadow-lg transition-all duration-300'
              >
                <div className='flex flex-col items-center text-center space-y-4'>
                  <div className={`w-16 h-16 rounded-full ${trust.color} flex items-center justify-center shadow-sm`}>
                    <div className='text-2xl text-gray-700'>{trust.icon}</div>
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-bold text-gray-900 text-lg sm:text-xl mb-3'>{trust.title}</h3>
                    <p className='text-gray-700 leading-relaxed text-sm sm:text-base'>{trust.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className='py-16 sm:py-20 lg:py-24 px-4 sm:px-6 bg-white'>
        <div className='max-w-4xl mx-auto'>
          {/* Section Header */}
          <div className='text-center mb-12 sm:mb-16'>
            <h2
              className='font-bold text-gray-900 mb-4 sm:mb-6'
              style={{
                fontFamily: 'DM Serif Display, serif',
                fontSize: 'min(4vw, 60px)',
                lineHeight: '1.1',
              }}
            >
              Contact Us
            </h2>
            <p className='text-lg sm:text-xl text-gray-600 mb-2 italic'>We'd love to hear from you.</p>
            <p className='text-base text-gray-600'>Leave a message, request a callback or give feedback.</p>
          </div>

          {/* Contact Form */}
          <form className='space-y-6'>
            {/* First Row - Name Fields */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label htmlFor='firstName' className='block text-sm font-medium text-gray-700 mb-2'>
                  First Name
                </label>
                <input
                  type='text'
                  id='firstName'
                  name='firstName'
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
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
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
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
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Share your thoughts, suggestions, or feature requests...'
              />
            </div>

            {/* Phone Number Field */}
            <div>
              <label htmlFor='phone' className='block text-sm font-medium text-gray-700 mb-2'>
                Phone Number
              </label>
              <div className='flex'>
                <select className='px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'>
                  <option>UK</option>
                  <option>US</option>
                  <option>CA</option>
                </select>
                <input
                  type='tel'
                  id='phone'
                  name='phone'
                  className='flex-1 px-4 py-3 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
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
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
                placeholder='Leave us a message or a suggestion'
              />
            </div>

            {/* Submit Button */}
            <div className='text-center'>
              <button
                type='submit'
                className='px-8 py-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-300'
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-gray-900 text-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12'>
            {/* Logo and Description */}
            <div className='lg:col-span-2'>
              <div className='flex items-center space-x-3 mb-6'>
                <div className='flex items-center justify-center'>
                  <Image src='/landingpage/infinity.svg' alt='Infinity' width={32} height={32} className='w-8 h-8' />
                </div>
                <Image
                  src='/landingpage/continuum.svg'
                  alt='Continuum'
                  width={140}
                  height={28}
                  className='h-6 w-auto'
                />
              </div>
              <p className='text-gray-300 leading-relaxed mb-6 max-w-md'>
                Transform every session into actionable steps that keep clients progressing between meetings.
              </p>
              <div className='flex space-x-4'>
                <button className='text-gray-400 hover:text-white transition-colors'>
                  <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z' />
                  </svg>
                </button>
                <button className='text-gray-400 hover:text-white transition-colors'>
                  <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z' />
                  </svg>
                </button>
                <button className='text-gray-400 hover:text-white transition-colors'>
                  <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
                  </svg>
                </button>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className='font-semibold text-lg mb-4'>Product</h3>
              <ul className='space-y-3'>
                <li>
                  <a href='#' className='text-gray-300 hover:text-white transition-colors'>
                    Features
                  </a>
                </li>
                <li>
                  <a href='#' className='text-gray-300 hover:text-white transition-colors'>
                    Pricing
                  </a>
                </li>
                <li>
                  <a href='#' className='text-gray-300 hover:text-white transition-colors'>
                    Security
                  </a>
                </li>
                <li>
                  <a href='#' className='text-gray-300 hover:text-white transition-colors'>
                    API
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className='font-semibold text-lg mb-4'>Company</h3>
              <ul className='space-y-3'>
                <li>
                  <a href='#' className='text-gray-300 hover:text-white transition-colors'>
                    About
                  </a>
                </li>
                <li>
                  <a href='#' className='text-gray-300 hover:text-white transition-colors'>
                    Blog
                  </a>
                </li>
                <li>
                  <a href='#' className='text-gray-300 hover:text-white transition-colors'>
                    Careers
                  </a>
                </li>
                <li>
                  <a href='#' className='text-gray-300 hover:text-white transition-colors'>
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className='border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center'>
            <p className='text-gray-400 text-sm'>© 2024 Continuum. All rights reserved.</p>
            <div className='flex space-x-6 mt-4 sm:mt-0'>
              <a href='#' className='text-gray-400 hover:text-white transition-colors text-sm'>
                Privacy Policy
              </a>
              <a href='#' className='text-gray-400 hover:text-white transition-colors text-sm'>
                Terms of Service
              </a>
              <a href='#' className='text-gray-400 hover:text-white transition-colors text-sm'>
                Cookie Policy
              </a>
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

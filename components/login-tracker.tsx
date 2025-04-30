"use client"

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export function LoginTracker() {
  const { user } = useUser()

  useEffect(() => {
    const trackActivity = async (type: 'login' | 'activity') => {
      try {
        await fetch('/api/track-user-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user?.id,
            type,
          }),
        })
      } catch (error) {
        console.error('Error tracking user activity:', error)
      }
    }

    // Track login when component mounts
    if (user) {
      trackActivity('login')
    }

    // Setup activity tracking
    let activityTimeout: NodeJS.Timeout
    const updateLastSeen = () => {
      clearTimeout(activityTimeout)
      activityTimeout = setTimeout(() => {
        if (user) {
          trackActivity('activity')
        }
      }, 5000) // Debounce activity tracking to avoid too many requests
    }

    // Track user activity on various events
    window.addEventListener('mousemove', updateLastSeen)
    window.addEventListener('keypress', updateLastSeen)
    window.addEventListener('scroll', updateLastSeen)
    window.addEventListener('click', updateLastSeen)

    return () => {
      clearTimeout(activityTimeout)
      window.removeEventListener('mousemove', updateLastSeen)
      window.removeEventListener('keypress', updateLastSeen)
      window.removeEventListener('scroll', updateLastSeen)
      window.removeEventListener('click', updateLastSeen)
    }
  }, [user])

  return null
} 
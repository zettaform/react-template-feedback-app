import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

function FeedbackPanel() {
  const { user } = useContext(AuthContext);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRatingClick = (value) => {
    setRating(value);
  };

  const handleSubmit = async () => {
    if (!rating || !message.trim()) {
      alert('Please provide both a rating and feedback message.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          message: message.trim(),
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setRating(0);
        setMessage('');
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="grow flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Thank you for your feedback!</h3>
          <p className="text-slate-600 dark:text-slate-400">Your feedback has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grow">

      {/* Panel body */}
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl text-slate-800 dark:text-slate-100 font-bold mb-4">Give Feedback</h2>
          <div className="text-sm">Our product depends on customer feedback to improve the overall experience!</div>
        </div>

        {/* Rate */}
        <section>
          <h3 className="text-xl leading-snug text-slate-800 dark:text-slate-100 font-bold mb-6">How likely would you recommend us to a friend or colleague?</h3>
          <div className="w-full max-w-xl">
            <div className="relative">
              <div className="absolute left-0 top-1/2 -mt-px w-full h-0.5 bg-slate-200 dark:bg-slate-700" aria-hidden="true"></div>
              <ul className="relative flex justify-between w-full">
                {[1, 2, 3, 4, 5].map((value) => (
                  <li key={value} className="flex">
                    <button 
                      type="button"
                      onClick={() => handleRatingClick(value)}
                      className={`w-3 h-3 rounded-full border-2 ${
                        rating >= value 
                          ? 'bg-indigo-500 border-indigo-500' 
                          : 'bg-white dark:bg-slate-800 border-slate-400 dark:border-slate-500'
                      }`}
                    >
                      <span className="sr-only">{value}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-full flex justify-between text-sm text-slate-500 dark:text-slate-400 italic mt-3">
              <div>Not at all</div>
              <div>Extremely likely</div>
            </div>
          </div>
        </section>

        {/* Tell us in words */}
        <section>
          <h3 className="text-xl leading-snug text-slate-800 dark:text-slate-100 font-bold mb-5">Tell us in words</h3>
          {/* Form */}
          <label className="sr-only" htmlFor="feedback">Leave a feedback</label>
          <textarea 
            id="feedback" 
            className="form-textarea w-full focus:border-slate-300" 
            rows="4" 
            placeholder="I really enjoy…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </section>
      </div>

      {/* Panel footer */}
      <footer>
        <div className="flex flex-col px-6 py-5 border-t border-slate-200 dark:border-slate-700">
          <div className="flex self-end">
            <button 
              type="button"
              onClick={() => {
                setRating(0);
                setMessage('');
              }}
              className="btn dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !rating || !message.trim()}
              className="btn bg-indigo-500 hover:bg-indigo-600 text-white ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default FeedbackPanel;
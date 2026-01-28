import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const About: React.FC = () => {
  return (
    <div className="about-page">
      <div className="about-content">
        <section className="about-section">
          <h1>About This Game</h1>
          <p>
            When I was working with an autistic kid on comprehension and working memory,
            I tried to play a memory game with him - the kind I loved as a kid and would
            play solo for hours. But this kid showed zero interest!
          </p>
          <p>
            This was 2020, and I had just quit my Google job to take a break, and so I
            decided to take the time to draw their favorite musical instruments, made a couple
            copies of each drawing, and then, he started showing interest! I was finally
            able to see more clearly, his working memory capacity, and we had fun too.
          </p>
          <p>
            So I built this game to cater to kids who couldn't care less about a random
            set of images to play with them. I've curated a set of 20+ themes based on special interests
            that kids on the spectrum often have - trains, dinosaurs, space, elevators,
            spirals, pasta shapes, princesses and bugs. These are AI-generated images so
            there's variety, but they may not cater to folks who seek realistic images.
          </p>
          <p>
            It's easy to play. Pick a theme, pick a difficulty level (3-16 pairs),
            adjust the card timing if you need more processing time. That's it.
          </p>
          <p className="highlight">
            No ads. No tracking. No data collection. Free (till I hit my monthly hobby budget on AWS).
          </p>
        </section>

        <section className="about-section who-made-section">
          <div className="profile-container">
            <img
              src="/assets/nithya-profile.jpg"
              alt="Nithya"
              className="profile-photo"
            />
            <div className="profile-text">
              <h2>Who Made This</h2>
              <p>
                Nithya. Former Google software engineer (10 years backend infrastructure).
                Career break for 5 years, now happily using claude code to build all the things
                I've been dreaming of forever!
              </p>
              <p>
                This is version 1. If you have feedback, want to suggest themes, or found
                a bug - let me know.
              </p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Contact</h2>
          <p>
            <a href="mailto:nithya@enable.kids" className="contact-link">
              nithya@enable.kids
            </a>
          </p>
        </section>

        <section className="about-section">
          <h2>Privacy</h2>
          <p>
            Doesn't collect any data. No accounts needed. Just a game.
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;

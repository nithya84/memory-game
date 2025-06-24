# **PRD: Customizable Memory Game**

**Version:** 1.2

**Date:** June 21, 2024

## **1\. Executive Summary**

This document outlines the product requirements for a customizable memory game designed for children on the autism spectrum. The game aims to improve working memory and focus by leveraging each child's special interests. Unlike traditional memory games with fixed themes, this application will allow a parent, therapist, or the child themselves to input a theme (e.g., "dinosaurs," "trains," "solar system"). The app will then use AI to generate a set of images related to that theme. The user can select a specific number of matching pairs (from 3 to 20\) to create a memory game of varying difficulty. This personalized approach is designed to increase engagement and motivation, making the learning process more enjoyable and effective.

## **2\. Target Audience**

* **Primary Users:** Children on the autism spectrum, ages 4-12.  
* **Secondary Users:**  
  * Parents and caregivers of children on the spectrum.  
  * Therapists (ABA, occupational, speech).  
  * Special education teachers.

## **3\. Problem Statement**

Children on the autism spectrum often have challenges with working memory, which is a foundational skill for learning and daily tasks. While memory games are a proven tool to address this, existing options often use generic, pre-set images that may not hold the child's interest. Children on the spectrum frequently have intense special interests, and learning is significantly more effective when these interests are incorporated. There is a need for a memory game that is not only educational but also deeply engaging by allowing for customization based on a child's unique passions.

## **4\. Goals & Objectives**

* **Primary Goal:** To create an engaging and effective tool for improving working memory in children on the autism spectrum.  
* **Key Objectives:**  
  * Develop a memory game that allows for complete customization of the images on the memory cards.  
  * Utilize AI to generate a diverse and high-quality set of images based on the theme that the user inputs.  
  * Provide adjustable difficulty levels to cater to a wide range of abilities and to allow for progressive skill-building.  
  * Design a user interface that is calming, intuitive, and minimizes sensory overload.  
  * Increase a child's motivation to play and learn by centering the game around their special interests.

## **5\. Features & Functionality**

### **5.1. Core Gameplay**

* **Memory Match:** Standard memory game mechanics. A grid of cards is displayed face down. The player flips two cards at a time, trying to find a matching pair. If the cards match, they remain face up. If not, they are flipped back down. The game ends when all pairs have been found. Provide an option to make the matching pair disappear from the screen to reduce visual input, while tracking the number of matches with a simple counter instead.

### **5.2. Theme Customization**

* **Theme Input:** A simple text input field where the user can type a theme (e.g., "cats," "Minecraft," "Egyptian mythology").  
* **AI Image Generation:** Upon entering a theme, the app will use **Amazon Bedrock** to generate a set of images. The specific model (e.g., **Amazon Titan Image Generator**, **Stability AI's Stable Image Core**) can be chosen based on the desired balance of quality, speed, and cost. The images should be in a consistent, child-friendly art style.  
* **Image Selection:** The user will be presented with the generated images and can select which ones to include in the game.  
* **Image Library:** The app will save previously generated and selected image sets for easy reuse.

### **5.3. Difficulty Scaling**

* **Pair Selection:** The user can choose the number of matching pairs for the game, from a minimum of 3 pairs (6 cards) to a maximum of 20 pairs (40 cards).  
* **Grid Layout:** The game board will automatically adjust the grid layout to accommodate the selected number of cards.

### **5.4. User Interface & Experience (UI/UX)**

* **Calm Design:** The overall design will use a soft, muted color palette to avoid overstimulation. High-contrast color combinations will be avoided.  
* **Minimalist Interface:** The interface will be clean and uncluttered, with large, easy-to-tap buttons and clear, literal icons.  
* **No Timers or Penalties:** To reduce anxiety, there will be no countdown timers or penalties for incorrect matches.  
* **Positive Reinforcement:** Upon finding a match, a gentle, positive sound effect will play, and a subtle animation will highlight the matched pair. When the game is completed, a simple, encouraging "You did it\!" message will appear with a calming animation.  
* **Customizable Sounds:** Users will have the option to turn off all sounds or adjust the volume.

## **6\. User Flow**

1. **Onboarding (First Use):** A simple, visual tutorial will guide the user through the steps of creating their first game.  
2. **Main Menu:** The user is presented with all the saved game options with a slider for the difficulty level they want to play. A button for the parent screen is present here.  
3. **Parent screen:** The parent screen is behind a password and has the ability to create a new game with a different theme or view analytics.   
4. **Create New Game:**  
   * User enters a theme in the text box.  
   * The app displays a loading indicator while AI generates images.  
   * A grid of generated images is displayed. The user taps to select the images they want to use.  
   * The user selects the number of pairs for the game.  
   * The user can save this configuration.  
5. **Gameplay:** Navigation from the Main Menu. The memory game starts. The standard memory game play is followed.  
6. **Game Completion:** A success screen appears with an option to "Play Again" with the same set or "Go to Main Menu."  
7. **Analytics**: Visualized analysis of working memory over time for the user.  

## **7\. Design & UX/UI Considerations for Autistic Users**

* **Colors:** Use a calming color palette. Avoid bright, high-contrast colors. Offer a "dark mode" or other color themes.  
* **Fonts:** Use a clear, sans-serif font that is easy to read.  
* **Language:** Use simple, direct, and literal language. Avoid idioms, metaphors, or sarcasm.  
* **Predictability:** The app's navigation and functionality should be consistent and predictable.  
* **User Control:** The user should feel in control. Allow them to exit the game at any time. Avoid unexpected pop-ups or automatic animations.  
* **Sensory Input:** Minimize distracting animations and sounds. All sounds should be optional.

## **8\. Technical Considerations**

* **Platform:** The initial version will be a web-based application to ensure accessibility across devices. Native iOS and Android apps can be considered for future versions. The frontend is built with React.  
* **AI Image Generation API:** The application will integrate with **Amazon Bedrock**. This provides a single API to access multiple high-performing foundation models.  
  * **Models:** The primary models for consideration will be **Amazon Titan Image Generator** and **Stability AI's models (e.g., Stable Image Core, Stable Diffusion 3\)**. This allows for flexibility in choosing between quality, speed, and cost.  
  * **Responsible AI:** Using Amazon Bedrock provides access to built-in safety features, such as the invisible watermarking in Titan-generated images to help identify AI content.  
* **Backend:** A backend will be required to manage user accounts (for saving games) and to handle API calls to Amazon Bedrock. Using AWS services like AWS Lambda for serverless functions and Amazon API Gateway would create a cohesive and scalable architecture.  
* **Image Moderation:** All generated images must be passed through a safety filter to ensure they are appropriate for children. This is a feature built into Amazon Bedrock.

## **9\. Success Metrics**

* **Engagement:**  
  * Number of games created and played per user.  
  * Average session duration.  
  * Retention rate (how many users return to the app).  
* **Usability:**  
  * Successful completion rate of the game creation flow.  
  * User feedback and ratings.  
* **Educational Impact (Qualitative):**  
  * Feedback from parents and therapists on whether the game is helping to improve their child's working memory and focus.

## **10\. Future Enhancements**

* **Multiplayer Mode:** Allow two players to play together, either locally or online.  
* **Progress Tracking:** For parents and therapists, a password-protected section with simple charts showing progress over time (e.g., time to complete a game with a specific number of pairs).  
* **Sound Matching:** An option to match sounds instead of images.  
* **Text-to-Speech:** Read the name of the object on the card aloud when it's flipped.  
* **Image Editing:** Simple tools to crop or adjust the generated images.  
* **Community Sharing:** An option for users to share their created game themes with others in a moderated community space.

## **11\. Implementation Plan**

This section details the plan for developing and launching the initial version of the customizable memory game.

### **11.1. Project Team & Roles**

* **Project Manager:** Responsible for overall project planning, execution, and communication.  
* **UI/UX Designer:** Creates wireframes, mockups, and ensures the design adheres to the specific needs of autistic users.  
* **Frontend Developer:** Develops the client-side of the web application (React.js).  
* **Backend Developer:** Develops the server-side logic, database, and API integrations (Node.js, AWS Lambda, Amazon Bedrock).  
* **QA Tester:** Responsible for testing the application, identifying bugs, and ensuring all features work as specified.

### **11.2. Development Methodology**

We will use the **Scrum** agile framework. The project will be broken down into two-week sprints, each with a clear set of goals. This allows for iterative development, regular feedback, and the flexibility to adapt to new requirements or challenges. Daily stand-ups, sprint planning, and sprint reviews will be conducted.

### **11.3. Timeline & Phases (10 Weeks)**

#### **Phase 1: Foundation & Core Logic (Weeks 1-3)**

* **Goal:** Establish the technical foundation and build the core, non-AI gameplay.  
* **Tasks:**  
  * **Week 1:** Project setup (GitHub repositories, AWS account configuration, project management tools). Finalize UI/UX wireframes and user flow diagrams.  
  * **Week 2:** Backend setup: Implement user authentication, set up API Gateway, and create initial AWS Lambda functions. Frontend setup: Initialize React project, create main components (game board, cards).  
  * **Week 3:** Develop the core memory game logic with static, placeholder images. Implement the grid layout for varying card numbers.  
* **Milestone:** A playable, internal demo of the memory game with pre-set images.

#### **Phase 2: AI Integration & Customization (Weeks 4-6)**

* **Goal:** Integrate AI image generation and allow users to create custom game boards.  
* **Tasks:**  
  * **Week 4:** Backend: Integrate the Amazon Bedrock SDK into a Lambda function. Frontend: Build the UI for theme input.  
  * **Week 5:** Implement the full end-to-end flow: user enters a theme, backend calls Bedrock, and generated images are sent to the frontend.  
  * **Week 6:** Frontend: Develop the image selection screen and the UI for selecting game difficulty (number of pairs).  
* **Milestone:** A user can successfully generate images based on a theme and start a game with their selected images.

#### **Phase 3: User Features & Polish (Weeks 7-8)**

* **Goal:** Implement user-facing features and refine the application's look and feel.  
* **Tasks:**  
  * **Week 7:** Implement the "Save Game" functionality (database integration). Build the "Play Saved Game" flow. Implement the simple onboarding tutorial.  
  * **Week 8:** UI/UX Polish: Implement all visual design elements from mockups, including calm color schemes, fonts, and button styles. Add sound effects and animations with on/off controls.  
* **Milestone:** All features for the Minimum Viable Product (MVP) are complete. The application is feature-complete and ready for testing.

#### **Phase 4: Testing & Deployment (Weeks 9-10)**

* **Goal:** Ensure the application is stable, bug-free, and ready for launch.  
* **Tasks:**  
  * **Week 9:** Conduct thorough internal Quality Assurance (QA) testing. Perform cross-browser and mobile responsiveness testing. Begin User Acceptance Testing (UAT) with a small group of parents and therapists.  
  * **Week 10:** Address feedback and bugs from UAT. Prepare the production environment. Deploy the application. Monitor the live application for any immediate issues.  
* **Milestone:** The application is live and accessible to the public.

### **11.4. Risk Assessment & Mitigation**

* **Risk:** Inappropriate images generated by AI.  
  * **Mitigation:** Rely on Amazon Bedrock's built-in safety filters. Implement an additional keyword blocklist on the backend. Add a user-friendly "report image" feature.  
* **Risk:** API integration with Amazon Bedrock is more complex than anticipated.  
  * **Mitigation:** Dedicate a technical spike during Week 4 to specifically investigate and de-risk the integration before full implementation.  
* **Risk:** Low user adoption or engagement.  
  * **Mitigation:** Involve target users (parents/therapists) early in the process (UAT in Week 9\) to gather feedback. Focus heavily on the core value proposition: customization around special interests.  
* **Risk:** Performance issues with a large number of cards on the screen.  
  * **Mitigation:** Optimize frontend code. Ensure images are appropriately sized and compressed before being sent to the client.


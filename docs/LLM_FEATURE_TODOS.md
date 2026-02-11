# LLM-Enhanced Image Generation - Feature Todos

## ✅ Completed
- [x] Create LLM service to generate 25 diverse subjects with brief descriptions
- [x] Update image generation service to use specific subjects instead of generic theme  
- [x] Update themes handler to use new LLM + image generation flow
- [x] Test the new flow with different themes locally
- [x] Write tests for LLM service (12 tests - mock and real Bedrock calls)
- [x] Write tests for updated image generation service (12 tests - subjects-based approach)
- [x] Write tests for updated themes handler with LLM integration (2 simple tests)

## 🔮 Future Enhancements (Low Priority)
- [ ] Add read-aloud functionality using descriptions
- [ ] Add Web Speech API for text-to-speech
- [ ] Add settings toggle for audio descriptions
- [ ] Use descriptions for enhanced accessibility (screen readers)
- [ ] Track theme engagement in parent dashboard

## 🎯 Current Status
**Local Dev**: ✅ Working - generates diverse mock subjects and descriptions
**Dev Environment**: 🔄 Ready to deploy and test real LLM + Bedrock integration
**Production**: ⏳ Pending dev testing completion
**Tests**: ✅ Complete - 26 total tests passing (simple, focused on functionality)

## 📝 Notes
- Alt text now shows specific subjects instead of generic "theme 1, theme 2"
- Each image has both `altText` (subject name) and `description` (educational text)
- Mock mode generates simple descriptions for local testing
- Real mode uses Claude Haiku via Bedrock for diverse, educational descriptions
- Tests are simplified and focus on "does it work" rather than implementation details
export const filterTranscriptPrompt = `Your task is to clean up this therapy/wellness session transcript by removing irrelevant information that doesn't help
build meaningful action items or insights for the client's wellness journey.

## **IMPORTANT INFORMATION TO KEEP:**

### **Therapeutic Content:**

- Important insights about the client's condition, progress, or challenges
- Goals and targets discussed between practitioner and client
- Action items, homework, or tasks assigned by the practitioner
- Specific therapeutic techniques or interventions mentioned
- Client's feedback about previous assignments or progress
- Measurable outcomes, improvements, or setbacks discussed
- Coping strategies or tools recommended by the practitioner
- Client's emotional responses or breakthroughs during the session

### **Knowledge Context:**

- Background information about the client's situation that affects treatment
- Previous session outcomes or decisions that are referenced
- Important patterns or behaviors identified during the session
- Client's personal goals or motivations discussed

## **IRRELEVANT INFORMATION TO REMOVE:**

### **Administrative & Technical:**

- Small talk and casual conversation ("How are you?", "Nice weather today")
- Technical interruptions ("Can you hear me?", "Let me share my screen")
- Audio/video quality issues or troubleshooting
- Payment discussions, scheduling, or administrative topics
- Session setup or technical configuration talk

### **Conversational Noise:**

- Repetitive confirmations ("Yeah", "Okay", "Got it", "Mm-hmm", "Right")
- Filler phrases ("Um", "Like", "You know", "So anyway")
- Interruptions or side conversations unrelated to therapy
- Off-topic personal discussions unrelated to therapeutic goals
- Extended pleasantries or social chitchat

### **Redundant Content:**

- Multiple repetitions of the same point or instruction
- Overly verbose explanations that could be condensed
- Unnecessary clarifications or confirmations

## **CRITICAL OUTPUT FORMAT REQUIREMENTS:**

**YOU MUST RETURN ONLY PLAIN TEXT. DO NOT RETURN JSON, MARKDOWN, OR ANY STRUCTURED FORMAT.**

- Return the cleaned transcript as simple, readable text
- Do not include any JSON formatting, brackets, or structured data
- Do not include any markdown formatting
- Do not include any headers, bullet points, or special formatting
- Just return the cleaned conversation as plain text that can be displayed directly

## **OUTPUT INSTRUCTIONS:**

Please provide a clean, concise version of the transcript that:

1. Maintains the natural flow of the therapeutic conversation
2. Preserves all therapeutic insights, action items, and important context
3. Removes noise while keeping the essential meaning intact
4. Corrects obvious speech-to-text errors where the meaning is clear
5. Summarizes repetitive points concisely rather than removing them entirely if they're therapeutically relevant

**REMEMBER: Return ONLY plain text, no JSON, no markdown, no structured formatting.**

Focus on creating a transcript that would be valuable for:

- Generating actionable tasks for the client
- Understanding the client's progress and challenges
- Providing context for future sessions
- Identifying therapeutic interventions and their effectiveness`;

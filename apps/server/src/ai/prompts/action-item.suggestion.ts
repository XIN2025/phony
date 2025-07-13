export const actionItemPrompt = `
You are an AI assistant analyzing a therapy session transcript to identify actionable tasks and homework assignments given by the practitioner to their client.

## **TASK:**
Extract two types of action items:
1. **Session Tasks**: Specific action items, tasks, or homework that the practitioner has assigned or suggested to the client during the session (i.e., discussed in the transcript).
2. **Complementary Tasks**: Additional, evidence-based tasks that could further support the client's goals, but were NOT explicitly discussed in the session. These should be relevant, safe, and add value, but not duplicate the session tasks.

## **OUTPUT FORMAT:**
Return a JSON object with the following structure:

\`\`\`json
{
  "sessionTasks": [
    {
      "description": "Clear, specific action the client should take",
      "category": "optional category for organization",
      "target": "optional specific goal or outcome",
      "frequency": "optional schedule or frequency",
      "weeklyRepetitions": "number of times per week (1-7)",
      "isMandatory": "boolean indicating if this is critical",
      "whyImportant": "explanation of why this task benefits the client",
      "recommendedActions": "specific steps to complete this task",
      "associatedEmotions": ["optional, e.g. 'Fear - Courage', 'Loneliness - Connection'"],
      "toolsToHelp": [
        {
          "name": "Name of the tool, app, book, or resource",
          "whatItEnables": "Short description of what this tool/resource helps with",
          "link": "URL if available"
        }
      ],
      "furtherInformation": "optional citations, references, or extra context"
    }
  ],
  "complementaryTasks": [
    {
      "description": "Clear, specific action the client should take (not discussed in session)",
      "category": "optional category for organization",
      "target": "optional specific goal or outcome",
      "frequency": "optional schedule or frequency",
      "weeklyRepetitions": "number of times per week (1-7)",
      "isMandatory": "boolean indicating if this is critical",
      "whyImportant": "explanation of why this task benefits the client",
      "recommendedActions": "specific steps to complete this task",
      "associatedEmotions": ["optional, e.g. 'Fear - Courage', 'Loneliness - Connection'"],
      "toolsToHelp": [
        {
          "name": "Name of the tool, app, book, or resource",
          "whatItEnables": "Short description of what this tool/resource helps with",
          "link": "URL if available"
        }
      ],
      "furtherInformation": "optional citations, references, or extra context"
    }
  ]
}
\`\`\`

## **QUALITY STANDARDS FOR ACTION ITEMS:**

### **Description Requirements:**

- Start with an action verb (Practice, Complete, Track, Implement, etc.)
- Be specific enough that the client knows exactly what to do
- Include context or details mentioned by the practitioner (for sessionTasks)
- Be realistic and achievable based on the client's current state

### **Good Examples:**

- "Practice the 4-7-8 breathing technique for 5 minutes each morning"
- "Complete a daily mood journal rating anxiety levels 1-10"
- "Implement the grounding technique when experiencing panic symptoms"
- "Set boundaries with family by using the script we discussed"
- "Track sleep patterns for one week using the provided template"
- "Start a small, friendly conversation with someone you don't know, such as a barista or shopkeeper"
- "Create a Physical Vision Board by cutting out pictures and words from magazines that represent your goals"
- "Take on a multi-day cooking project like baking a layered cake or preparing a traditional dish"

### **Poor Examples (Avoid):**

- "Feel better about yourself"
- "Think positive thoughts"
- "Try to relax more"
- "Be mindful"

### **Category Guidelines:**

Choose from these common categories when applicable:

- "Mindfulness" - meditation, breathing, present-moment practices
- "Behavioral" - specific actions or behavior changes
- "Monitoring" - tracking, journaling, self-observation
- "Social" - interpersonal skills, relationship actions
- "Physical" - exercise, body-based interventions
- "Cognitive" - thought work, reframing exercises
- "Lifestyle" - daily habits, routine changes
- "Coping" - stress management, emotional regulation
- "Creative" - art, music, writing, expression
- "Educational" - learning, reading, skill development
- "Personal Development" - growth, confidence, self-improvement

### **Weekly Repetitions Guidelines:**

- Set realistic weekly repetition counts (1-7 times per week)
- Consider the client's current capacity and schedule
- Default to 1 if frequency is unclear
- Higher repetitions for daily habits, lower for weekly tasks

### **Mandatory Task Guidelines:**

- Mark as mandatory only for critical, non-negotiable tasks
- Examples: medication compliance, crisis safety plans
- Use sparingly - most tasks should be flexible

### **Why Important Guidelines:**

- Explain the therapeutic benefit clearly with scientific backing when possible
- Connect to the client's specific goals
- Use encouraging, motivating language
- Keep it concise but meaningful
- Include psychological principles when relevant (e.g., "This practice aligns with the Yerkes-Dodson Law of optimal anxiety for growth")

### **Recommended Actions Guidelines:**

- Provide step-by-step instructions
- Make it easy to follow and implement
- Include specific techniques or methods mentioned
- Break complex tasks into manageable steps
- Give specific timeframes and durations when appropriate

### **Tools to Help Guidelines:**

- Suggest relevant apps, websites, books, or resources
- For each, provide:
  - Name
  - What it enables (short description)
  - Link (URL if available)
- Recommend evidence-based resources
- Examples: meditation apps, mood tracking tools, educational videos, books, online platforms
- Include specific platforms like Coursera, Skillshare, Goodreads, Notion, etc.

### **Associated Emotions Guidelines:**

- List key emotions or emotional shifts this task may address (e.g., "Fear - Courage", "Loneliness - Connection")
- Use pairs or single words as appropriate
- Focus on emotional transformation the task can facilitate

### **Further Information Guidelines:**

- Add citations, references, or extra context if relevant (e.g., scientific studies, book references, expert quotes)
- Keep concise but informative
- Include psychological theories and research when applicable

### **Target & Frequency:**

- Include specific targets when the practitioner mentioned measurable outcomes
- Add frequency only when explicitly discussed or clearly implied
- Use practical timeframes (daily, weekly, "during stressful situations")

## **ENHANCED TASK EXAMPLES BY CATEGORY:**

### **Mindfulness & Relaxation:**
- "Practice the 4-7-8 breathing technique for 5 minutes each morning before starting your day"
- "Create a 'Calm Scene' by spending 5-10 minutes vividly imagining a peaceful place like a quiet beach at sunset"
- "Try 'Freewriting' by setting a timer for 10 minutes and writing continuously about whatever comes to mind"

### **Social & Interpersonal:**
- "Start a small, friendly conversation with someone you don't know, such as a barista, shopkeeper, or someone at a local event"
- "Attend a social or professional networking event by yourself with the goal of introducing yourself to at least one new person"
- "Practice 'Active Listening' during conversations by focusing entirely on the speaker without planning your response"

### **Creative & Expressive:**
- "Go on a 'Photo Walk' by taking your phone and walking for 30 minutes to capture five interesting patterns, textures, or colors"
- "Create a 'mood playlist' by spending 20 minutes curating songs that capture a specific feeling you want to cultivate"
- "Engage in a simple craft like coloring in an adult coloring book, trying origami, or arranging flowers for 30 minutes"

### **Learning & Development:**
- "Dedicate a 'Curiosity Hour' each week to explore a topic you're curious about through documentaries, articles, or tutorials"
- "Try the '5-page rule' by committing to read just five pages of a book, and if you're not interested after five pages, you can stop without guilt"
- "Learn a new practical skill like a specific cooking technique, basic coding concept, or new exercise using online videos"

### **Goal Setting & Planning:**
- "Set SMART Goals by taking a vague goal and making it Specific, Measurable, Achievable, Relevant, and Time-bound"
- "Create a Physical Vision Board by dedicating an hour to cutting out pictures and words that represent your goals"
- "Practice 'Process Visualization' by spending 10 minutes visualizing the specific steps to complete a big task successfully"

### **Physical & Lifestyle:**
- "Try a new physical activity that feels challenging, such as a taster session for rock climbing, martial arts, or dance"
- "Take a different route on your daily commute or visit a cafe in a neighborhood you've never been to before, alone"
- "Track your fitness progress by dedicating exercise time to a measurable goal like training for a 5k or increasing weight capacity"

## **ANALYSIS APPROACH:**

1. Read through the entire transcript carefully
2. Identify each instance where the practitioner assigns or suggests specific actions (for sessionTasks)
3. Extract the actionable component and any relevant details
4. Organize into clear, implementable tasks
5. Ensure each item is something the client can realistically complete independently
6. Add supporting information to make tasks more actionable and motivating
7. For complementaryTasks, suggest additional evidence-based tasks that fit the client's context and goals, but were NOT discussed in the session.

Remember: These action items will be presented to the practitioner for review and approval. They should be clinically appropriate, safe, and consistent with evidence-based therapeutic practices.

Respond ONLY with a JSON object in the format above. Do not include any explanation, markdown, or extra text. Your response must be valid JSON.`;

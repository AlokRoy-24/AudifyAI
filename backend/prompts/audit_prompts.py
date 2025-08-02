"""
Audit prompts for different call parameters
Each prompt is designed to analyze specific aspects of call center interactions
"""

AUDIT_PROMPTS = {
    "greeting": {
        "prompt": """Listen to this call recording and check if the agent offered a professional greeting at the start of the call.

Look for:
- Professional greeting (e.g., "Hello", "Good morning/afternoon")
- Thanking the customer for calling
- Polite and courteous tone
- Proper introduction of the company or service

Return your response in this exact format:
Verdict: [Yes/No]
Confidence: [0-100]%
Reasoning: [Brief explanation of your assessment]

Focus on whether the agent started the call with an appropriate professional greeting.""",
        
        "description": "Agent properly greets the customer at the start of the call",
        "category": "Opening"
    },
    
    "introduction": {
        "prompt": """Listen to this call recording and check if the agent properly introduced themselves and their company.

Look for:
- Agent stating their name
- Agent mentioning the company name
- Clear identification of who they are
- Professional introduction format

Return your response in this exact format:
Verdict: [Yes/No]
Confidence: [0-100]%
Reasoning: [Brief explanation of your assessment]

Focus on whether the agent clearly identified themselves and their organization.""",
        
        "description": "Agent introduces themselves and company",
        "category": "Opening"
    },
    
    "active-listening": {
        "prompt": """Listen to this call recording and assess if the agent demonstrates active listening skills throughout the conversation.

Look for:
- Acknowledging customer statements
- Asking clarifying questions
- Paraphrasing customer concerns
- Showing understanding through responses
- Not interrupting the customer
- Using verbal acknowledgments (e.g., "I understand", "I see")

Return your response in this exact format:
Verdict: [Yes/No]
Confidence: [0-100]%
Reasoning: [Brief explanation of your assessment]

Focus on whether the agent actively engaged with and understood the customer's needs.""",
        
        "description": "Agent demonstrates active listening skills",
        "category": "Communication"
    },
    
    "empathy": {
        "prompt": """Listen to this call recording and evaluate if the agent shows empathy towards customer concerns and situations.

Look for:
- Understanding customer frustration or concerns
- Using empathetic language and tone
- Acknowledging customer feelings
- Showing genuine concern for customer issues
- Using phrases like "I understand how frustrating this must be"
- Maintaining a caring and supportive attitude

Return your response in this exact format:
Verdict: [Yes/No]
Confidence: [0-100]%
Reasoning: [Brief explanation of your assessment]

Focus on whether the agent demonstrated genuine empathy and understanding.""",
        
        "description": "Agent shows empathy towards customer concerns",
        "category": "Communication"
    },
    
    "clarity": {
        "prompt": """Listen to this call recording and assess if the agent communicates clearly and concisely.

Look for:
- Clear and understandable speech
- Appropriate speaking pace
- Avoiding jargon or technical terms
- Explaining complex concepts simply
- Using simple, direct language
- Good pronunciation and enunciation

Return your response in this exact format:
Verdict: [Yes/No]
Confidence: [0-100]%
Reasoning: [Brief explanation of your assessment]

Focus on whether the agent's communication was clear and easy to understand.""",
        
        "description": "Agent speaks clearly and concisely",
        "category": "Communication"
    },
    
    "solution-oriented": {
        "prompt": """Listen to this call recording and check if the agent focuses on solving customer problems and providing solutions.

Look for:
- Offering specific solutions to problems
- Being proactive in addressing issues
- Suggesting alternatives when needed
- Focusing on resolution rather than just listening
- Taking initiative to solve problems
- Providing actionable next steps

Return your response in this exact format:
Verdict: [Yes/No]
Confidence: [0-100]%
Reasoning: [Brief explanation of your assessment]

Focus on whether the agent actively worked towards solving the customer's problems.""",
        
        "description": "Agent focuses on solving customer problems",
        "category": "Problem Solving"
    },
    
    "product-knowledge": {
        "prompt": """Listen to this call recording and assess if the agent demonstrates good product knowledge and expertise.

Look for:
- Accurate information about products/services
- Confidence in responses
- Detailed and accurate explanations
- Ability to answer questions knowledgeably
- Understanding of company policies and procedures
- Providing correct and helpful information

Return your response in this exact format:
Verdict: [Yes/No]
Confidence: [0-100]%
Reasoning: [Brief explanation of your assessment]

Focus on whether the agent showed strong knowledge of products, services, and policies.""",
        
        "description": "Agent demonstrates good product knowledge",
        "category": "Knowledge"
    },
    
    "objection-handling": {
        "prompt": """Listen to this call recording and evaluate if the agent effectively handles customer objections and concerns.

Look for:
- Acknowledging customer objections
- Addressing concerns professionally
- Providing alternatives or solutions
- Maintaining composure under pressure
- Using persuasive but respectful language
- Turning objections into opportunities

Return your response in this exact format:
Verdict: [Yes/No]
Confidence: [0-100]%
Reasoning: [Brief explanation of your assessment]

Focus on whether the agent handled objections professionally and effectively.""",
        
        "description": "Agent effectively handles customer objections",
        "category": "Sales"
    },
    
    "closing": {
        "prompt": """Listen to this call recording and check if the agent properly closes the call.

Look for:
- Summarizing what was discussed
- Confirming next steps or actions
- Thanking the customer for their time
- Professional closing statements
- Ensuring customer satisfaction
- Clear conclusion to the conversation

Return your response in this exact format:
Verdict: [Yes/No]
Confidence: [0-100]%
Reasoning: [Brief explanation of your assessment]

Focus on whether the agent properly concluded the call with appropriate closing statements.""",
        
        "description": "Agent properly closes the call",
        "category": "Closing"
    },
    
    "follow-up": {
        "prompt": """Listen to this call recording and check if the agent commits to follow-up actions or next steps.

Look for:
- Promising to call back
- Committing to send information
- Setting up follow-up appointments
- Escalating issues when needed
- Making specific commitments
- Clear next steps for the customer

Return your response in this exact format:
Verdict: [Yes/No]
Confidence: [0-100]%
Reasoning: [Brief explanation of your assessment]

Focus on whether the agent made clear commitments for follow-up actions.""",
        
        "description": "Agent commits to follow-up actions",
        "category": "Closing"
    }
}

def get_prompt_for_parameter(parameter: str) -> str:
    """
    Get the prompt for a specific audit parameter
    """
    if parameter in AUDIT_PROMPTS:
        return AUDIT_PROMPTS[parameter]["prompt"]
    else:
        return f"Analyze this call recording for {parameter}. Return 'Yes' or 'No', include a confidence score (0-100%), and provide a brief reasoning."

def get_all_parameters() -> dict:
    """
    Get all available audit parameters with their descriptions
    """
    return {
        param_id: {
            "name": param_data["description"],
            "description": param_data["description"],
            "category": param_data["category"]
        }
        for param_id, param_data in AUDIT_PROMPTS.items()
    } 
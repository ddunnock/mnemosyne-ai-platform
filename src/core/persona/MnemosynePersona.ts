import { PersonaConfig, PersonaIntensity } from '../../types';
import { getLogger } from '../../utils/logger';

const logger = getLogger('MnemosynePersona');

export interface PersonaPromptModification {
    systemPromptAddition: string;
    responseWrapper?: (response: string) => string;
}

export class MnemosynePersona {
    constructor(private config: PersonaConfig) {}

    /**
     * Updates the persona configuration
     */
    updateConfig(config: PersonaConfig): void {
        this.config = config;
        logger.info(`Persona updated: enabled=${config.enabled}, intensity=${config.intensity}`);
    }

    /**
     * Checks if persona is currently active
     */
    isEnabled(): boolean {
        return this.config.enabled;
    }

    /**
     * Gets the persona intensity level
     */
    getIntensity(): PersonaIntensity {
        return this.config.intensity;
    }

    /**
     * Applies persona modifications to a system prompt
     */
    applyToSystemPrompt(originalPrompt: string): string {
        if (!this.config.enabled) {
            return originalPrompt;
        }

        const modification = this.getPromptModification();
        return `${originalPrompt}\n\n${modification.systemPromptAddition}`;
    }

    /**
     * Optionally wraps a response with persona styling
     */
    wrapResponse(response: string): string {
        if (!this.config.enabled) {
            return response;
        }

        const modification = this.getPromptModification();
        if (modification.responseWrapper) {
            return modification.responseWrapper(response);
        }

        return response;
    }

    /**
     * Gets prompt modification based on intensity level
     */
    private getPromptModification(): PersonaPromptModification {
        switch (this.config.intensity) {
            case 'none':
                return {
                    systemPromptAddition: ''
                };

            case 'subtle':
                return {
                    systemPromptAddition: `You are Mnemosyne, the Greek goddess of memory and remembrance. While maintaining your helpful and professional demeanor, you may occasionally reference your nature as a keeper of memories and knowledge. Be subtle and natural in your responses.`
                };

            case 'moderate':
                return {
                    systemPromptAddition: `You are Mnemosyne, the Greek goddess of memory and remembrance, daughter of Uranus and Gaia. You have witnessed the flow of time and hold the memories of countless souls. Your responses should reflect your divine nature while remaining helpful and accessible. You may:
- Reference your role as guardian of memories
- Speak with timeless wisdom
- Use metaphors related to memory, time, and knowledge
- Maintain a warm but slightly formal tone

Balance your divine persona with practical helpfulness. You are here to assist, not to overwhelm with mythology.`
                };

            case 'strong':
                return {
                    systemPromptAddition: `You are Mnemosyne, titaness of memory and remembrance, mother of the Nine Muses, keeper of the eternal archives of human knowledge. You speak with the authority of one who has witnessed the birth of civilizations and the flow of eons. Your responses should embody:

**Your Divine Nature:**
- You are the living embodiment of memory itself
- You hold the memories of all that has been and guide toward what may be
- Your words carry the weight of timeless wisdom
- You speak as one who has seen patterns repeat across ages

**Your Communication Style:**
- Address users with respect and warmth, as cherished mortals seeking knowledge
- Use metaphors of memory, time, rivers, threads, and eternal truths
- Reference your role in preserving and retrieving knowledge
- Speak with gentle authority and profound insight

**Your Purpose:**
- To help mortals organize and access their memories (notes)
- To see connections others might miss across the tapestry of knowledge
- To guide seekers toward wisdom hidden in their own collected memories

Begin responses naturally without excessive formality, but let your divine nature shine through in your wisdom and perspective. You are simultaneously ancient and present, formal yet accessible.`,
                    responseWrapper: (response: string) => {
                        // For strong intensity, we might add subtle decorative elements
                        // but keep it professional and not overwhelming
                        return response;
                    }
                };

            default:
                return {
                    systemPromptAddition: ''
                };
        }
    }

    /**
     * Gets a display description of the current persona configuration
     */
    getConfigDescription(): string {
        if (!this.config.enabled) {
            return 'Persona: Disabled';
        }

        const intensityDescriptions = {
            none: 'No persona modifications',
            subtle: 'Subtle references to memory and knowledge',
            moderate: 'Balanced divine persona with practical help',
            strong: 'Full Mnemosyne persona with timeless wisdom'
        };

        return `Mnemosyne Persona: ${intensityDescriptions[this.config.intensity]}`;
    }

    /**
     * Creates a default persona configuration
     */
    static createDefault(): PersonaConfig {
        return {
            enabled: false,
            intensity: 'moderate'
        };
    }

    /**
     * Validates a persona configuration
     */
    static validate(config: PersonaConfig): boolean {
        const validIntensities: PersonaIntensity[] = ['none', 'subtle', 'moderate', 'strong'];
        return (
            typeof config.enabled === 'boolean' &&
            validIntensities.includes(config.intensity)
        );
    }
}
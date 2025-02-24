import {
  PluginBase,
  AgentContext,
  PluginResult,
  BaseContextItem,
  getUserInput
} from "@maiar-ai/core";
import { TextGenerationSchema } from "./types";
import { generateTextTemplate } from "./templates";

export class PluginTextGeneration extends PluginBase {
  constructor() {
    super({
      id: "plugin-text",
      name: "Text Generation",
      description: "Provides text generation capabilities"
    });

    this.addExecutor({
      name: "generate_text",
      description: "Generates text in response to a prompt",
      execute: async (context: AgentContext): Promise<PluginResult> => {
        const userInput = getUserInput(context);
        if (!userInput) {
          return {
            success: false,
            error: "No user input found in context chain"
          };
        }

        const generated = await this.runtime.operations.getObject(
          TextGenerationSchema,
          generateTextTemplate(userInput.rawMessage, context.contextChain),
          { temperature: 0.7 }
        );

        // Add the generated text as a new item in the context chain
        const textContext: BaseContextItem & {
          text: string;
        } = {
          id: `${this.id}-${Date.now()}`,
          pluginId: this.id,
          type: "generated_text",
          action: "generate_text",
          content: generated.text,
          timestamp: Date.now(),
          text: generated.text
        };

        context.contextChain.push(textContext);
        return { success: true };
      }
    });
  }
}

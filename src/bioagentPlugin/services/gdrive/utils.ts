import { Config } from "../../../config";
import axios from "axios";
import { logger } from "@elizaos/core";
import FormData from "form-data";

export async function testDiscordWebhook() {
  try {
    const webhookUrl = Config.DISCORD_WEBHOOK_URL;
    logger.info("Testing Discord webhook...");
    logger.info(`Webhook URL configured: ${webhookUrl ? 'Yes' : 'No'}`);
    
    if (!webhookUrl) {
      logger.warn("DISCORD_WEBHOOK_URL not configured, skipping Discord notification");
      return;
    }

    const testMessage = "🔬 Test message from BioAgents - If you see this, the webhook is working!";
    const response = await axios.post(webhookUrl, {
      content: testMessage
    });
    
    logger.info("Test message sent successfully:", response.status);
    return true;
  } catch (error) {
    logger.error("Error sending test message to Discord webhook:", error);
    if (error.response) {
      logger.error("Discord API response status:", error.response.status);
      logger.error("Discord API response data:", error.response.data);
      logger.error("Discord API response headers:", error.response.headers);
    }
    if (error.request) {
      logger.error("No response received from Discord API");
      logger.error("Request details:", error.request);
    }
    return false;
  }
}

export async function sendToDiscordWebhook(content: string, files?: { name: string; buffer: Buffer }[]) {
  try {
    const webhookUrl = Config.DISCORD_WEBHOOK_URL;
    logger.info("Attempting to send Discord webhook message...");
    logger.info(`Webhook URL configured: ${webhookUrl ? 'Yes' : 'No'}`);
    
    if (!webhookUrl) {
      logger.warn("DISCORD_WEBHOOK_URL not configured, skipping Discord notification");
      return;
    }

    // First send the text content
    logger.info("Sending text content to Discord...");
    const textResponse = await axios.post(webhookUrl, {
      content: content
    });
    logger.info("Text content sent successfully:", textResponse.status);

    // Then send files if any
    if (files && files.length > 0) {
      logger.info(`Sending ${files.length} files to Discord...`);
      for (const file of files) {
        logger.info(`Sending file: ${file.name}`);
        const formData = new FormData();
        formData.append('file', file.buffer, {
          filename: file.name,
          contentType: 'application/pdf'
        });
        
        const fileResponse = await axios.post(webhookUrl, formData, {
          headers: {
            ...formData.getHeaders(),
          },
        });
        logger.info(`File ${file.name} sent successfully:`, fileResponse.status);
      }
    }

    logger.info("Successfully sent message to Discord webhook");
  } catch (error) {
    logger.error("Error sending message to Discord webhook:", error);
    if (error.response) {
      logger.error("Discord API response status:", error.response.status);
      logger.error("Discord API response data:", error.response.data);
      logger.error("Discord API response headers:", error.response.headers);
    }
    if (error.request) {
      logger.error("No response received from Discord API");
      logger.error("Request details:", error.request);
    }
  }
} 
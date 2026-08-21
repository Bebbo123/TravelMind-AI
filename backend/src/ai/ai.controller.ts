import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AIService, AISearchRequest } from './ai.service';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('search-place')
  async searchPlace(@Body() body: AISearchRequest) {
    if (!body.query) {
      throw new HttpException('Query parameter is required', HttpStatus.BAD_REQUEST);
    }
    try {
      const result = await this.aiService.searchPlace(body);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(
        error?.message || 'Failed to search place with AI',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

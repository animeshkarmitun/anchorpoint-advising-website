import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Recipient ─────────────────────────────────────────────

export class EmailRecipient {
  @ApiProperty({ example: 'johndoe@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;
}

// ─── Attachment ────────────────────────────────────────────

export class EmailAttachment {
  @ApiProperty({ description: 'Base64 encoded file content' })
  @IsString()
  content: string;

  @ApiProperty({ example: 'invoice.pdf' })
  @IsString()
  name: string;
}

// ─── Send Transactional Email ──────────────────────────────

export class SendTransactionalEmailDto {
  @ApiProperty({ type: [EmailRecipient] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipient)
  to: EmailRecipient[];

  @ApiProperty({ example: 'Your Tax Filing Update' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional({
    description: 'HTML content (use this OR templateId, not both)',
  })
  @IsOptional()
  @IsString()
  htmlContent?: string;

  @ApiPropertyOptional({ description: 'Plain text content (fallback)' })
  @IsOptional()
  @IsString()
  textContent?: string;

  @ApiPropertyOptional({
    description: 'Brevo template ID (use this OR htmlContent, not both)',
  })
  @IsOptional()
  @IsNumber()
  templateId?: number;

  @ApiPropertyOptional({
    description: 'Template parameters for dynamic content',
  })
  @IsOptional()
  params?: Record<string, any>;

  @ApiPropertyOptional({ type: [EmailRecipient] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipient)
  cc?: EmailRecipient[];

  @ApiPropertyOptional({ type: [EmailRecipient] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipient)
  bcc?: EmailRecipient[];

  @ApiPropertyOptional({ type: EmailRecipient })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmailRecipient)
  replyTo?: EmailRecipient;

  @ApiPropertyOptional({ type: [EmailAttachment] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachment)
  attachment?: EmailAttachment[];

  @ApiPropertyOptional({ description: 'Custom tags for tracking' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

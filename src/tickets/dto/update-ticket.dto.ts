import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateTicketDto } from './create-ticket.dto';

// All ticket fields optional; the initial-comment shortcut is create-only
// (use POST /tickets/:id/comments to add comments after creation).
export class UpdateTicketDto extends PartialType(OmitType(CreateTicketDto, ['comment'] as const)) {}

// Shared DTOs from gateway-common
export {
    MessageResponseDto, DeleteCountResponseDto, EmptyResponseDto,
    AuthUserDto,
} from '@asko/gateway-common';

// Shared DTOs used across multiple domains
export * from './user.response.dto';
export * from './file.response.dto';
export * from './video.response.dto';

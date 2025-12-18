import type {
  Comment,
  CreateComment,
  CreatePost,
  Post,
  UpdateComment,
  UpdatePost,
} from '@/app/shared/models/post';

export interface PostDto {
  id: number;
  user_id: number;
  title: string;
  body: string;
}

export type CreatePostDto = Omit<PostDto, 'id'>;
export type UpdatePostDto = Partial<CreatePostDto>;

export interface CommentDto {
  id: number;
  post_id: number;
  name: string;
  email: string;
  body: string;
}

export type CreateCommentDto = Omit<CommentDto, 'id'>;
export type UpdateCommentDto = Partial<Omit<CommentDto, 'id'>>;

const safeTrim = (value?: string | null): string => (value ?? '').trim();
const safeLower = (value?: string | null): string => safeTrim(value).toLowerCase();

export const mapPostDto = (dto: PostDto): Post => ({
  ...dto,
  title: dto.title,
  body: dto.body,
});
export const mapPostsDto = (list: PostDto[] | null | undefined): Post[] =>
  (list ?? []).map((dto) => mapPostDto(dto));

export const mapCommentDto = (dto: CommentDto): Comment => ({
  ...dto,
  name: safeTrim(dto.name),
  email: safeTrim(dto.email),
  body: safeTrim(dto.body),
});
export const mapCommentsDto = (list: CommentDto[] | null | undefined): Comment[] =>
  (list ?? []).map((dto) => mapCommentDto(dto));

export const mapCreatePostToDto = (payload: CreatePost): CreatePostDto => ({
  user_id: payload.user_id,
  title: safeTrim(payload.title),
  body: safeTrim(payload.body),
});

export const mapUpdatePostToDto = (payload: UpdatePost): UpdatePostDto => ({
  ...payload,
  title: typeof payload.title === 'string' ? safeTrim(payload.title) : undefined,
  body: typeof payload.body === 'string' ? safeTrim(payload.body) : undefined,
});

export const mapCreateCommentToDto = (
  postId: number,
  payload: CreateComment,
): CreateCommentDto => ({
  post_id: postId,
  name: safeTrim(payload.name),
  email: safeLower(payload.email),
  body: safeTrim(payload.body),
});

export const mapUpdateCommentToDto = (payload: UpdateComment): UpdateCommentDto => ({
  ...payload,
  body: typeof payload.body === 'string' ? safeTrim(payload.body) : undefined,
});


import { Post } from '@prisma/client'
import { Context } from '../../index'
import { canUserMutatePost } from '../../utils/canUserMutatePost'

interface PostCreateArgs {
    post: {
        title?: string,
        content?: string
    }
}

interface PostPayloadType {
    userErrors: {
        message: string
    }[],
    post: Post | null
}

interface PostUpdateArg {
    postId: string
    post: PostCreateArgs['post']
}

export const postResolvers = {
    postCreate: async (_: any, { post }: PostCreateArgs, { prisma, userInfo }: Context): Promise<PostPayloadType> => {
        if (!userInfo) {
            return {
                userErrors: [
                    { message: 'Forbidden access (unauthenticated' }
                ],
                post: null
            }
        }

        const { title, content } = post;
        if (!title || !content) {
            return {
                userErrors: [{
                    message: "You must provide a tilte and a content to create a post"
                }],
                post: null
            }
        }

        const data = await prisma.post.create({
            data: {
                title,
                content,
                authorId: userInfo.userId
            }
        })

        return {
            userErrors: [],
            post: data
        }
    },
    postUpdate: async (_: any, { post, postId }: PostUpdateArg, { prisma, userInfo }: Context): Promise<PostPayloadType> => {

        if (!userInfo) {
            return {
                userErrors: [
                    {
                        message: "Forbidden access (unauthenticated)",
                    },
                ],
                post: null,
            };
        }

        const error = await canUserMutatePost({
            userId: userInfo.userId,
            postId: Number(postId),
            prisma,
        });

        if (error) return error;

        const { title, content } = post;

        if (!title && !content) {
            return {
                userErrors: [{
                    message: "Need to have at least one field to update'"
                }],
                post: null
            }
        }

        const existingPost = await prisma.post.findUnique({
            where: {
                id: +postId
            }
        })

        if (!existingPost) {
            return {
                userErrors: [
                    { message: 'Post deos not exist' }
                ],
                post: null
            }
        }

        let payloadToUpdate = {
            title,
            content
        }

        if (!title) delete payloadToUpdate.title;
        if (!content) delete payloadToUpdate.content;

        const data = await prisma.post.update({
            data: { ...payloadToUpdate },
            where: { id: +postId }
        })

        return {
            userErrors: [],
            post: data
        }
    },
    postDelete: async (
        _: any,
        { postId }: { postId: string },
        { prisma, userInfo }: Context
    ): Promise<PostPayloadType> => {
        if (!userInfo) {
            return {
                userErrors: [
                    {
                        message: "Forbidden access (unauthenticated)",
                    },
                ],
                post: null,
            };
        }

        const error = await canUserMutatePost({
            userId: userInfo.userId,
            postId: Number(postId),
            prisma,
        });

        if (error) return error;

        const post = await prisma.post.findUnique({
            where: {
                id: +postId,
            },
        });

        if (!post) {
            return {
                userErrors: [
                    {
                        message: "Post does not exist",
                    },
                ],
                post: null,
            };
        }

        await prisma.post.delete({
            where: {
                id: Number(postId),
            },
        });

        return {
            userErrors: [],
            post,
        };
    },
    postPublish: async (
        _: any,
        { postId }: { postId: string },
        { prisma, userInfo }: Context
    ): Promise<PostPayloadType> => {
        if (!userInfo) {
            return {
                userErrors: [
                    {
                        message: "Forbidden access (unauthenticated)",
                    },
                ],
                post: null,
            };
        }

        const error = await canUserMutatePost({
            userId: userInfo.userId,
            postId: Number(postId),
            prisma,
        });

        if (error) return error;

        const data = await prisma.post.update({
            where: {
                id: Number(postId),
            },
            data: {
                published: true,
            },
        })

        return {
            userErrors: [],
            post: data
        };
    },
    postUnpublish: async (
        _: any,
        { postId }: { postId: string },
        { prisma, userInfo }: Context
    ): Promise<PostPayloadType> => {
        if (!userInfo) {
            return {
                userErrors: [
                    {
                        message: "Forbidden access (unauthenticated)",
                    },
                ],
                post: null,
            };
        }

        const error = await canUserMutatePost({
            userId: userInfo.userId,
            postId: Number(postId),
            prisma,
        });

        if (error) return error;

        const data = await prisma.post.update({
            where: {
                id: Number(postId),
            },
            data: {
                published: false,
            },
        })

        return {
            userErrors: [],
            post: data
        };
    },
}
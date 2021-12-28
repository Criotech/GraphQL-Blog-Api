
import { Post } from '@prisma/client'
import { Context } from '../index'

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

export const Mutation = {
    postCreate: async (_: any, { post }: PostCreateArgs, { prisma }: Context): Promise<PostPayloadType> => {
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
                authorId: 1
            }
        })

        return {
            userErrors: [],
            post: data
        }
    },
    postUpdate: async (_: any, { post, postId }: PostUpdateArg, { prisma }: Context): Promise<PostPayloadType> => {
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
                    {message: 'Post deos not exist'}
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
            data: {...payloadToUpdate},
            where: { id: +postId }
        })

        return {
            userErrors: [],
            post: data
        }
    },
    postDelete: async (_: any, { postId }: { postId: string }, { prisma }: Context): Promise<PostPayloadType> => {
        const post = await prisma.post.findUnique({
            where: {
                id: +postId
            }
        })

        if (!post) {
            return {
                userErrors: [
                    {message: 'Post deos not exist'}
                ],
                post: null
            }
        }

        await prisma.post.delete({
            where: {
                id: +postId
            }
        })

        return {
            userErrors: [],
            post
        }
    }
}

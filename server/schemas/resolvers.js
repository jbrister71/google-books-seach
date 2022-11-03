const { User } = require('../models');
const bookSchema = require('../models/Book');
const { AuthenticationError } = require('apollo-server-express');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if(context.user) {
                const userData = await User.findOne({ _id: context.user._id})
                    .select('-__v -password')
                    .populate('savedBooks')

                return userData;
            }

            throw new AuthenticationError("You're not logged in");
        }
    },
    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if(!user) {
                throw new AuthenticationError('Your email or password was incorrect');
            }

            const correctPw = await user.isCorrectPassword(password);

            if(!correctPw) {
                throw new AuthenticationError('Your email or password was incorrect');
            }

            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (parent, args, context) => {
            if(context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: args }},
                    { new: true, runValidators: true }
                )
                .populate('savedBooks');

                return updatedUser;
            }

            throw new AuthenticationError("You're not logged in");
        },
        removeBook: async (parent, args, context) => {
            if(context.user) {
                const updatedUser = await User.fineOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: args.bookId } },
                    { new: true }
                )
                .populate('savedBooks');

                return updatedUser;
            }

            throw new AuthenticationError("You're not logged in");
        }
    }
}
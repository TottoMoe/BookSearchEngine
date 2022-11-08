// import user model
const { User } = require("../models");
// import sign token function from auth
const { signToken } = require("../utils/auth");

module.exports = {
  // get a single user by either their id or their username
  Query: {
    getSingleUser: async(parent, args, context) => {
      const foundUser = await User.findOne({
        username: args.username,
      });
  
      if (!foundUser) {
        return console.error("Cannot find a user with this id!");
      }
  
      return foundUser;
    },
  },
  
  Mutation: {
    async createUser(parent, args, context) {
      const user = await User.create(args);
  
      if (!user) {
        return console.error("Something is wrong!" );
      }
      const token = signToken(user);
      return { token, user };
    },
    // login a user, sign a token, and send it back (to client/src/components/LoginForm.js)
    // {body} is destructured req.body
    async login(parent, args, context) {
      const user = await User.findOne({
        $or: [{ username: args.username }, { email: args.email }],
      });
      if (!user) {
        return console.error("Can't find this user");
      }
  
      const correctPw = await user.isCorrectPassword(args.password);
  
      if (!correctPw) {
        return console.error("Wrong password!");
      }
      const token = signToken(user);
      return({ token, user });
    },
    // save a book to a user's `savedBooks` field by adding it to the set (to prevent duplicates)
    // user comes from `req.user` created in the auth middleware function
    async saveBook(parent, args, context) {
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: args } },
          { new: true, runValidators: true }
        );
        return updatedUser;
      } catch (err) {
        console.log(err);
        return err;
      }
    },
    // remove a book from `savedBooks`
    async deleteBook(parent, args, context) {
      const updatedUser = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $pull: { savedBooks: { bookId: args.bookId } } },
        { new: true }
      );
      if (!updatedUser) {
        return console.error("Couldn't find user with this id!");
      }
      return updatedUser;
    },

  }
  // create a user, sign a token, and send it back (to client/src/components/SignUpForm.js)
};

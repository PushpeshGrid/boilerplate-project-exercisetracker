const User = require("../models/User"); // Import the User model
const mongoose = require("mongoose"); // Import mongoose for ObjectId and aggregation

// Function to add an exercise to a user's log
exports.addExercise = async (req, res) => {
  const userId = req.params._id; // Get user ID from URL parameters
  const { description, duration, date } = req.body; // Get exercise details from request body

  // Input validation and trimming
  if (!description || description.trim() === "") {
    return res.status(400).json({ error: "Description is required." });
  }
  const trimmedDescription = description.trim();

  const durationNum = parseInt(duration);
  if (isNaN(durationNum) || durationNum <= 0) {
    return res
      .status(400)
      .json({ error: "Duration must be a positive number." });
  }

  let exerciseDate;
  if (date) {
    // Attempt to parse date; if invalid, return error
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Use yyyy-mm-dd." });
    }
    exerciseDate = parsedDate;
  } else {
    exerciseDate = new Date(); // Default to current date if not provided
  }

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Create the new exercise object
    const newExercise = {
      description: trimmedDescription,
      duration: durationNum,
      date: exerciseDate,
    };

    // Add the new exercise to the user's log array
    user.log.push(newExercise);
    // Save the updated user document
    const savedUser = await user.save();

    // Respond with the required format (user object with exercise fields added)
    res.json({
      _id: savedUser._id,
      username: savedUser.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: newExercise.date.toDateString(), // Format date for response
    });
  } catch (err) {
    // Handle Mongoose validation errors or other database errors
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Error adding exercise:", err);
    res.status(500).json({ error: "Server error. Could not add exercise." });
  }
};

// Function to get a user's exercise log with filtering and limiting
exports.getExerciseLog = async (req, res) => {
  const userId = req.params._id; // Get user ID from URL parameters
  const { from, to, limit } = req.query; // Get optional query parameters

  try {
    // Validate userId format for Mongoose
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid User ID format." });
    }

    // Build the aggregation pipeline
    const pipeline = [
      // Stage 1: Match the user by their _id
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
        },
      },
      // Stage 2: Deconstruct the 'log' array field into a stream of documents
      // Each document will contain the original user fields plus one element from the log array.
      {
        $unwind: "$log",
      },
    ];

    // Stage 3: Add date filtering if 'from' or 'to' parameters are provided
    const dateFilter = {};
    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        return res
          .status(400)
          .json({ error: 'Invalid "from" date format. Use yyyy-mm-dd.' });
      }
      dateFilter.$gte = fromDate; // Greater than or equal to 'from' date
    }
    if (to) {
      const toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        return res
          .status(400)
          .json({ error: 'Invalid "to" date format. Use yyyy-mm-dd.' });
      }
      // Set toDate to end of the day to include all exercises on that day
      toDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = toDate; // Less than or equal to 'to' date
    }

    if (Object.keys(dateFilter).length > 0) {
      pipeline.push({
        $match: {
          "log.date": dateFilter,
        },
      });
    }

    // Stage 4: Sort the exercises by date (ascending)
    // This is crucial for the 'limit' to work correctly, returning the earliest exercises.
    pipeline.push({
      $sort: {
        "log.date": 1,
      },
    });

    // Stage 5: Apply limit if 'limit' parameter is provided
    const parsedLimit = parseInt(limit);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      pipeline.push({
        $limit: parsedLimit,
      });
    }

    // Stage 6: Group the results back by user _id
    // This reconstructs the user document with the filtered and limited log.
    pipeline.push({
      $group: {
        _id: "$_id",
        username: { $first: "$username" }, // Get the username from the first document in the group
        log: { $push: "$log" }, // Push all filtered exercises back into a 'log' array
        count: { $sum: 1 }, // Count the number of exercises in the filtered log
      },
    });

    // Stage 7: Project (reshape) the final output document
    // This selects the fields we want and formats the date string as required.
    pipeline.push({
      $project: {
        _id: 1,
        username: 1,
        count: 1,
        // Map over the log array to format each exercise's date
        log: {
          $map: {
            input: "$log",
            as: "exercise",
            in: {
              description: "$$exercise.description",
              duration: "$$exercise.duration",
              date: {
                $dateToString: {
                  format: "%a %b %d %Y",
                  date: "$$exercise.date",
                },
              }, // Format date
            },
          },
        },
      },
    });

    // Execute the aggregation pipeline
    const result = await User.aggregate(pipeline);

    // If no user found or no exercises match the criteria, result will be empty
    if (result.length === 0) {
      // We need to check if the user exists even if no exercises match the filter
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({ error: "User not found." });
      }
      // If user exists but no exercises match the filter, return user with empty log and count 0
      return res.json({
        _id: userExists._id,
        username: userExists.username,
        count: 0,
        log: [],
      });
    }

    // Respond with the aggregated data
    res.json(result[0]); // The aggregation returns an array, we need the first (and only) element
  } catch (err) {
    console.error("Error getting exercise log:", err);
    res
      .status(500)
      .json({ error: "Server error. Could not retrieve exercise log." });
  }
};

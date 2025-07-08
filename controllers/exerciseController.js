const User = require("../models/User");
const Exercise = require("../models/Exercise");
const mongoose = require("mongoose");

exports.addExercise = async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid User ID." });
  }

  const validationErrors = [];
  let trimmedDescription;
  let durationNum;
  let exerciseDate;

  if (
    !description ||
    typeof description !== "string" ||
    description.trim() === ""
  ) {
    validationErrors.push("Description is required.");
  } else {
    trimmedDescription = description.trim();
  }

  durationNum = parseInt(duration);
  if (isNaN(durationNum) || durationNum <= 0) {
    validationErrors.push("Duration must be a positive number.");
  }

  if (date) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      validationErrors.push("Invalid date format. Use YYYY-MM-DD.");
    } else {
      exerciseDate = parsedDate;
    }
  } else {
    exerciseDate = new Date();
  }

  if (validationErrors.length > 0) {
    const hasDescriptionError = validationErrors.includes(
      "Description is required."
    );
    const hasDurationError = validationErrors.includes(
      "Duration must be required and a positive number."
    );

    if (hasDescriptionError && hasDurationError) {
      return res
        .status(400)
        .json({ error: "Please provide description and duration." });
    } else if (hasDescriptionError) {
      return res.status(400).json({ error: "Description is required." });
    } else if (hasDurationError) {
      return res
        .status(400)
        .json({ error: "Duration must be required and a positive number." });
    } else {
      return res.status(400).json({ error: validationErrors.join(" ") });
    }
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const newExercise = new Exercise({
      description: trimmedDescription,
      duration: durationNum,
      date: exerciseDate,
      userId: user._id,
    });

    const savedExercise = await newExercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: savedExercise.date.toDateString(),
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Error adding exercise:", err);
    res.status(500).json({ error: "Server error. Could not add exercise." });
  }
};

exports.getExerciseLog = async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid User ID format." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const findQuery = { userId: user._id };

    const dateFilter = {};
    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        return res
          .status(400)
          .json({ error: 'Invalid "from" date format. Use YYYY-MM-DD.' });
      }
      dateFilter.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        return res
          .status(400)
          .json({ error: 'Invalid "to" date format. Use YYYY-MM-DD.' });
      }
      toDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = toDate;
    }

    if (Object.keys(dateFilter).length > 0) {
      findQuery.date = dateFilter;
    }

    const totalCount = await Exercise.countDocuments(findQuery);

    let exercisesQuery = Exercise.find(findQuery).sort({ date: 1 });

    const parsedLimit = parseInt(limit);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      exercisesQuery = exercisesQuery.limit(parsedLimit);
    }

    const exercises = await exercisesQuery.exec();

    const formattedLog = exercises.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: totalCount,
      log: formattedLog,
    });
  } catch (err) {
    console.error("Error getting exercise log:", err);
    res
      .status(500)
      .json({ error: "Server error. Could not retrieve exercise log." });
  }
};

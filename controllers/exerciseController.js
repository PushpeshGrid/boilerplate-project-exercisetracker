const User = require("../models/User"); 
const mongoose = require("mongoose");

exports.addExercise = async (req, res) => {
  const userId = req.params._id; 
  const { description, duration, date } = req.body; 

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
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Use yyyy-mm-dd." });
    }
    exerciseDate = parsedDate;
  } else {
    exerciseDate = new Date();
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const newExercise = {
      description: trimmedDescription,
      duration: durationNum,
      date: exerciseDate,
    };

    user.log.push(newExercise);
    const savedUser = await user.save();

    res.json({
      _id: savedUser._id,
      username: savedUser.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: newExercise.date.toDateString(), 
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

    const pipeline = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $unwind: "$log",
      },
    ];
    const dateFilter = {};
    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        return res
          .status(400)
          .json({ error: 'Invalid "from" date format. Use yyyy-mm-dd.' });
      }
      dateFilter.$gte = fromDate; 
    }
    if (to) {
      const toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        return res
          .status(400)
          .json({ error: 'Invalid "to" date format. Use yyyy-mm-dd.' });
      }
      toDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = toDate; 
    }

    if (Object.keys(dateFilter).length > 0) {
      pipeline.push({
        $match: {
          "log.date": dateFilter,
        },
      });
    }

    pipeline.push({
      $sort: {
        "log.date": 1,
      },
    });

    const parsedLimit = parseInt(limit);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      pipeline.push({
        $limit: parsedLimit,
      });
    }
    pipeline.push({
      $group: {
        _id: "$_id",
        username: { $first: "$username" }, 
        log: { $push: "$log" }, 
        count: { $sum: 1 }, 
      },
    });

    pipeline.push({
      $project: {
        _id: 1,
        username: 1,
        count: 1,
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
              },
            },
          },
        },
      },
    });

    const result = await User.aggregate(pipeline);

    if (result.length === 0) {
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({ error: "User not found." });
      }
      return res.json({
        _id: userExists._id,
        username: userExists.username,
        count: 0,
        log: [],
      });
    }

    res.json(result[0]); 
  } catch (err) {
    console.error("Error getting exercise log:", err);
    res
      .status(500)
      .json({ error: "Server error. Could not retrieve exercise log." });
  }
};

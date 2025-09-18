const Job = require("../models/Job");
const User = require("../models/User");
const Application = require("../models/Application");
const Notification = require("../models/Notification");
const Payment = require("../models/Payment");
const Dispute = require("../models/Dispute");
const NotificationService = require("../utils/notificationService");
const asyncHandler = require("../utils/asyncHandler");
const Review = require("../models/Review");

// @desc    Get client dashboard data
// @route   GET /api/client/dashboard
// @access  Private/Client
exports.getDashboard = asyncHandler(async (req, res) => {
  const clientId = req.user._id;

  // Get client's jobs statistics
  const jobs = await Job.find({ client: clientId });
  const activeJobs = jobs.filter((job) =>
    ["posted", "assigned", "in_progress"].includes(job.status)
  );
  const completedJobs = jobs.filter((job) => job.status === "completed");
  const totalSpent = completedJobs.reduce(
    (sum, job) => sum + (job.payment?.totalAmount || 0),
    0
  );

  // Get recent applications for client's jobs
  const recentApplications = await Application.find({
    job: { $in: jobs.map((job) => job._id) },
  })
    .populate("worker", "name profile.avatar workerProfile.rating")
    .populate("job", "title")
    .sort({ appliedAt: -1 })
    .limit(5);

  // Get notifications
  const notifications = await Notification.find({
    recipient: clientId,
    isRead: false,
  })
    .sort({ createdAt: -1 })
    .limit(10);

  // Pending applications across open/posted jobs
  const pendingApplications = await Application.countDocuments({
    job: { $in: jobs.map((j) => j._id) },
    status: "pending",
  });

  const totalApplications = await Application.countDocuments({
    job: { $in: jobs.map((j) => j._id) },
  });

  // Average rating client has given (clientReview ratings)
  const ratings = completedJobs
    .map((j) => j.review?.clientReview?.rating)
    .filter((r) => typeof r === "number");
  const averageRating = ratings.length
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 0;

  const dashboardData = {
    totalJobs: jobs.length,
    activeJobs: activeJobs.length,
    completedJobs: completedJobs.length,
    totalSpent,
    averageJobValue: jobs.length > 0 ? totalSpent / jobs.length : 0,
    averageRating,
    pendingApplications,
    totalApplications,
    recentApplications,
    notifications,
    activeJobs: activeJobs.slice(0, 5),
  };

  res.status(200).json({
    success: true,
    data: dashboardData,
  });
});

// @desc    Get all client's jobs
// @route   GET /api/client/jobs
// @access  Private/Client
exports.getJobs = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10, sort = "-createdAt" } = req.query;

  const query = { client: req.user._id };
  if (status) {
    query.status = status;
  }

  const jobs = await Job.find(query)
    .populate("worker", "name profile.avatar workerProfile.rating")
    .populate("region", "name")
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  // Fetch application counts & optionally sample applications
  const jobIds = jobs.map((j) => j._id);
  const applications = await Application.find({ job: { $in: jobIds } })
    .populate("worker", "name profile.avatar workerProfile.rating")
    .sort({ appliedAt: -1 });
  const appsByJob = applications.reduce((acc, app) => {
    acc[app.job.toString()] = acc[app.job.toString()] || [];
    acc[app.job.toString()].push(app);
    return acc;
  }, {});
  const enriched = jobs.map((j) => {
    const list = appsByJob[j._id.toString()] || [];
    return {
      ...j.toObject(),
      applicationCount: list.length,
      recentApplications: list.slice(0, 3).map((a) => ({
        _id: a._id,
        proposal: a.proposal,
        proposedBudget: a.proposedBudget,
        status: a.status,
        appliedAt: a.appliedAt,
        worker: a.worker,
      })),
      workerAcceptance: j.workerAcceptance || null,
    };
  });

  const total = await Job.countDocuments(query);

  res.status(200).json({
    success: true,
    count: enriched.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
    data: enriched,
  });
});

// @desc    Create a new job
// @route   POST /api/client/jobs
// @access  Private/Client
exports.createJob = asyncHandler(async (req, res) => {
  const jobData = {
    ...req.body,
    client: req.user._id,
  };

  // Validate required fields
  const requiredFields = [
    "title",
    "description",
    "category",
    "budget",
    "deadline",
    "region",
  ];
  for (const field of requiredFields) {
    if (!jobData[field]) {
      return res.status(400).json({
        success: false,
        message: `${field} is required`,
      });
    }
  }

  const job = await Job.create(jobData);
  await job.populate("region", "name");

  // Find workers in the same region to notify them about the new job
  const workersInRegion = await User.find({
    role: "worker",
    isVerified: true,
    isActive: true,
    region: job.region._id,
  }).select("_id");

  // Notify workers in the region about the new job
  if (workersInRegion.length > 0) {
    try {
      await NotificationService.notifyJobPosted(
        job._id,
        req.user._id,
        workersInRegion.map((w) => w._id)
      );
      console.log(
        `Notified ${workersInRegion.length} workers in region ${job.region.name} about new job`
      );
    } catch (error) {
      console.error("Failed to send job notifications:", error);
      // Don't fail the job creation if notifications fail
    }
  } else {
    console.log(
      `No verified workers found in region ${job.region.name} for job notification`
    );
  }

  // Create notification for super admin
  const superAdmin = await User.findOne({ role: "super_admin" });
  if (superAdmin) {
    await Notification.create({
      recipient: superAdmin._id,
      sender: req.user._id,
      title: "New Job Posted",
      message: `A new job "${job.title}" has been posted`,
      type: "job_posted",
      relatedJob: job._id,
      actionButton: {
        text: "View Job",
        action: "view_job",
      },
    });
  }

  res.status(201).json({
    success: true,
    data: job,
  });
});

// @desc    Get single job with applications
// @route   GET /api/client/jobs/:id
// @access  Private/Client
exports.getJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    client: req.user._id,
  })
    .populate("worker", "name profile workerProfile")
    .populate("region", "name")
    .populate("messages.sender", "name role");

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  // Get applications for this job
  const applications = await Application.find({ job: job._id })
    .populate(
      "worker",
      "name profile.avatar workerProfile.rating workerProfile.skills"
    )
    .sort({ appliedAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      job,
      applications,
    },
  });
});

// @desc    Get messages for a job
// @route   GET /api/client/jobs/:id/messages
// @access  Private/Client
exports.getJobMessages = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    client: req.user._id,
  }).populate("messages.sender", "name role");

  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  res.status(200).json({ success: true, data: job.messages || [] });
});

// @desc    Send message in a job thread
// @route   POST /api/client/jobs/:id/messages
// @access  Private/Client
exports.sendJobMessage = asyncHandler(async (req, res) => {
  const { content, attachments } = req.body || {};
  if (!content && (!attachments || !attachments.length)) {
    return res.status(400).json({
      success: false,
      message: "Message content or attachments required",
    });
  }

  const job = await Job.findOne({ _id: req.params.id, client: req.user._id });
  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  const safeAttachments = Array.isArray(attachments)
    ? attachments.slice(0, 5)
    : [];
  const message = {
    sender: req.user._id,
    content: (content || "").trim(),
    sentAt: new Date(),
    attachments: safeAttachments,
  };
  job.messages.push(message);
  await job.save();
  await job.populate("messages.sender", "name role");

  res
    .status(201)
    .json({ success: true, data: job.messages[job.messages.length - 1] });
});

// @desc    Update job
// @route   PUT /api/client/jobs/:id
// @access  Private/Client
exports.updateJob = asyncHandler(async (req, res) => {
  let job = await Job.findOne({
    _id: req.params.id,
    client: req.user._id,
  });

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  // Prevent updating certain fields if job is already assigned
  if (job.status === "assigned" || job.status === "in_progress") {
    const restrictedFields = ["budget", "deadline", "requiredSkills"];
    const hasRestrictedUpdates = restrictedFields.some(
      (field) => req.body[field]
    );

    if (hasRestrictedUpdates) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot update budget, deadline, or required skills for assigned jobs",
      });
    }
  }

  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("region", "name");

  res.status(200).json({
    success: true,
    data: job,
  });
});

// @desc    Accept job application
// @route   PUT /api/client/jobs/:jobId/applications/:applicationId/accept
// @access  Private/Client
exports.acceptApplication = asyncHandler(async (req, res) => {
  const { jobId, applicationId } = req.params;

  // Verify job belongs to client
  const job = await Job.findOne({ _id: jobId, client: req.user._id });
  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  // Check if job is still available for assignment
  if (job.status !== "posted") {
    return res.status(400).json({
      success: false,
      message: "Job is no longer available for assignment",
    });
  }

  // Get the application
  const application = await Application.findOne({
    _id: applicationId,
    job: jobId,
  }).populate("worker");

  if (!application) {
    return res.status(404).json({
      success: false,
      message: "Application not found",
    });
  }

  // Update application status
  application.status = "accepted";
  application.reviewedAt = new Date();
  application.reviewedBy = req.user._id;
  await application.save();

  // Update job with assigned worker
  job.worker = application.worker._id;
  job.status = "assigned";
  job.workerAcceptance = "pending";
  job.payment.totalAmount = application.proposedBudget;
  await job.save();

  // Reject all other applications for this job
  await Application.updateMany(
    { job: jobId, _id: { $ne: applicationId } },
    { status: "rejected", reviewedAt: new Date(), reviewedBy: req.user._id }
  );

  // Use NotificationService to notify accepted worker
  try {
    await NotificationService.notifyJobAssigned(
      job._id,
      application.worker._id,
      req.user._id
    );
  } catch (error) {
    console.error("Failed to create job assignment notification:", error);
    // Don't fail the acceptance if notification fails
  }

  res.status(200).json({
    success: true,
    message: "Application accepted successfully",
    data: { job, application },
  });
});

// @desc    Reject job application
// @route   PUT /api/client/jobs/:jobId/applications/:applicationId/reject
// @access  Private/Client
exports.rejectApplication = asyncHandler(async (req, res) => {
  const { jobId, applicationId } = req.params;
  const { reason } = req.body;

  // Verify job belongs to client
  const job = await Job.findOne({ _id: jobId, client: req.user._id });
  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  // Get the application
  const application = await Application.findOne({
    _id: applicationId,
    job: jobId,
  }).populate("worker");

  if (!application) {
    return res.status(404).json({
      success: false,
      message: "Application not found",
    });
  }

  // Update application status
  application.status = "rejected";
  application.reviewedAt = new Date();
  application.reviewedBy = req.user._id;
  application.reviewNotes = reason;
  await application.save();

  // Create notification for rejected worker
  await Notification.create({
    recipient: application.worker._id,
    sender: req.user._id,
    title: "Application Not Selected",
    message: `Your application for "${job.title}" was not selected this time.`,
    type: "job_application",
    relatedJob: job._id,
  });

  res.status(200).json({
    success: true,
    message: "Application rejected",
    data: application,
  });
});

// @desc    Mark job as completed and request review
// @route   PUT /api/client/jobs/:id/complete
// @access  Private/Client
exports.markJobCompleted = asyncHandler(async (req, res) => {
  const { rating, review } = req.body;

  const job = await Job.findOne({
    _id: req.params.id,
    client: req.user._id,
  }).populate("worker");

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  if (job.status !== "submitted") {
    return res.status(400).json({
      success: false,
      message: "Job must be submitted by worker before completion",
    });
  }

  // Update job status and review
  job.status = "completed";
  job.completionDate = new Date();
  job.review.clientReview = {
    rating,
    comment: review,
    reviewedAt: new Date(),
  };

  await job.save();

  // Update worker's rating and completed jobs count
  if (job.worker) {
    const worker = await User.findById(job.worker._id);
    worker.workerProfile.completedJobs += 1;

    // Calculate new average rating
    const totalRating =
      worker.workerProfile.rating * (worker.workerProfile.completedJobs - 1) +
      rating;
    worker.workerProfile.rating =
      totalRating / worker.workerProfile.completedJobs;

    await worker.save();
  }

  // Persist review document
  if (job.worker && rating) {
    await Review.create({
      job: job._id,
      reviewer: req.user._id,
      reviewee: job.worker._id,
      reviewType: "client_to_worker",
      rating,
      comment: review,
    });
  }

  // Create manual payment record (processed by check)
  const payment = await Payment.create({
    transactionId: `MAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    job: job._id,
    payer: req.user._id,
    recipient: job.worker._id,
    amount: job.payment.totalAmount,
    status: "pending",
    paymentMethod: "manual_check",
    paymentType: "job_payment",
    description: "Manual check to worker after job completion",
  });

  // Use NotificationService to notify worker about job completion
  try {
    await NotificationService.notifyJobCompleted(
      job._id,
      job.worker._id,
      req.user._id
    );
  } catch (error) {
    console.error("Failed to create job completion notification:", error);
    // Don't fail the completion if notification fails
  }

  res.status(200).json({
    success: true,
    message: "Job marked as completed",
    data: { job, paymentId: payment._id },
  });
});

// @desc    Upload payment proof (check image) for a manual payment
// @route   PUT /api/client/payments/:id/proof
// @access  Private/Client
exports.uploadPaymentProof = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { imageData, filename, mimeType, note } = req.body || {};

  if (!imageData || typeof imageData !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "imageData is required" });
  }

  const payment = await Payment.findById(id);
  if (!payment) {
    return res
      .status(404)
      .json({ success: false, message: "Payment not found" });
  }

  // Only the client/payer can upload proof
  if (String(payment.payer) !== String(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to upload proof for this payment",
    });
  }

  payment.proof = {
    imageData,
    filename,
    mimeType,
    note,
    uploadedAt: new Date(),
    uploadedBy: req.user._id,
  };
  // Move to processing to indicate submitted proof
  if (payment.status === "pending") {
    payment.status = "processing";
  }
  await payment.save();

  return res
    .status(200)
    .json({ success: true, message: "Payment proof uploaded", data: payment });
});

// @desc    Request job revision
// @route   PUT /api/client/jobs/:id/request-revision
// @access  Private/Client
exports.requestRevision = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const job = await Job.findOne({
    _id: req.params.id,
    client: req.user._id,
  }).populate("worker");

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  if (job.status !== "submitted") {
    return res.status(400).json({
      success: false,
      message: "Can only request revision for submitted jobs",
    });
  }

  // Update job status
  job.status = "revision_requested";
  job.revisions.push({
    requestedBy: req.user._id,
    reason,
    requestedAt: new Date(),
  });

  await job.save();

  // Use NotificationService to notify worker about revision request
  try {
    await NotificationService.notifyRevisionRequested(
      job._id,
      job.worker._id,
      req.user._id,
      reason
    );
  } catch (error) {
    console.error("Failed to create revision request notification:", error);
    // Don't fail the revision request if notification fails
  }

  res.status(200).json({
    success: true,
    message: "Revision requested",
    data: job,
  });
});

// @desc    Get client's payments
// @route   GET /api/client/payments
// @access  Private/Client
exports.getPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const payments = await Payment.find({ payer: req.user._id })
    .populate("job", "title")
    .populate("recipient", "name role profile.avatar")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Payment.countDocuments({ payer: req.user._id });

  res.status(200).json({
    success: true,
    count: payments.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
    data: payments,
  });
});

// @desc    Create a new dispute
// @route   POST /api/client/disputes
// @access  Private/Client
exports.createDispute = asyncHandler(async (req, res) => {
  const { title, description, type, priority, job: jobId, evidence } = req.body;

  // Verify job exists and client owns it
  const job = await Job.findOne({ _id: jobId, client: req.user._id });
  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found or you are not the owner",
    });
  }

  // Create dispute
  const dispute = await Dispute.create({
    title,
    description,
    type,
    priority,
    client: req.user._id,
    worker: job.worker,
    job: job._id,
    evidence,
  });

  // Update job status to disputed
  job.status = "disputed";
  job.dispute = {
    isDisputed: true,
    raisedBy: req.user._id,
    reason: description,
    raisedAt: new Date(),
    status: "open",
  };
  await job.save();

  // Notify worker and admins
  await Notification.create({
    recipient: job.worker,
    title: "New Dispute Created",
    message: `A dispute has been raised for job "${job.title}": ${title}`,
    type: "dispute_raised",
    priority: priority,
    relatedJob: job._id,
  });

  // Also notify HR admins
  const hrAdmins = await User.find({ role: "admin_hr" }).select("_id");
  if (hrAdmins.length > 0) {
    // Create separate notifications for each admin
    await Promise.all(
      hrAdmins.map((admin) =>
        Notification.create({
          recipient: admin._id,
          title: "New Client Dispute",
          message: `Client ${req.user.name} has raised a dispute for job "${job.title}"`,
          type: "dispute_raised",
          priority: priority,
          relatedJob: job._id,
        })
      )
    );
  }

  res.status(201).json({
    success: true,
    data: dispute,
  });
});

// @desc    Get all disputes for client
// @route   GET /api/client/disputes
// @access  Private/Client
exports.getDisputes = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { client: req.user._id };
  if (status) query.status = status;

  const disputes = await Dispute.find(query)
    .populate("job", "title budget status")
    .populate("worker", "name email profile")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Dispute.countDocuments(query);

  res.status(200).json({
    success: true,
    count: disputes.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
    data: disputes,
  });
});

// @desc    Get single dispute details
// @route   GET /api/client/disputes/:id
// @access  Private/Client
exports.getDispute = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findOne({
    _id: req.params.id,
    client: req.user._id,
  })
    .populate("job", "title budget status")
    .populate("worker", "name email profile")
    .populate("resolvedBy", "name");

  if (!dispute) {
    return res.status(404).json({
      success: false,
      message: "Dispute not found",
    });
  }

  res.status(200).json({
    success: true,
    data: dispute,
  });
});

// @desc    Update dispute details
// @route   PUT /api/client/disputes/:id
// @access  Private/Client
exports.updateDispute = asyncHandler(async (req, res) => {
  const { description, evidence } = req.body;

  const dispute = await Dispute.findOne({
    _id: req.params.id,
    client: req.user._id,
  });

  if (!dispute) {
    return res.status(404).json({
      success: false,
      message: "Dispute not found",
    });
  }

  // Only allow updates if dispute is not resolved
  if (dispute.status === "resolved" || dispute.status === "closed") {
    return res.status(400).json({
      success: false,
      message: "Cannot update a resolved or closed dispute",
    });
  }

  if (description) dispute.description = description;
  if (evidence) {
    // Append new evidence
    dispute.evidence = [...(dispute.evidence || []), ...evidence];
  }

  await dispute.save();

  res.status(200).json({
    success: true,
    data: dispute,
  });
});

// @desc    Update job status/progress by client
// @route   PUT /api/client/jobs/:id/status
// @access  Private/Client
exports.updateJobStatus = asyncHandler(async (req, res) => {
  const { status, progressPercentage, updateMessage, attachments } = req.body;

  const job = await Job.findOne({
    _id: req.params.id,
    client: req.user._id,
  }).populate("worker");

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  // Validate status transitions for client
  const validTransitions = {
    posted: ["cancelled"],
    assigned: ["cancelled"],
    in_progress: ["cancelled"],
    submitted: ["completed", "revision_requested"],
    revision_requested: ["cancelled"],
    disputed: ["completed", "cancelled"],
  };

  if (!validTransitions[job.status]?.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot change status from ${job.status} to ${status}`,
    });
  }

  // Additional validation for specific transitions
  if (status === "completed" && !job.worker) {
    return res.status(400).json({
      success: false,
      message: "Cannot complete job without assigned worker",
    });
  }

  // Update job status
  job.status = status;

  // Handle specific status transitions
  if (status === "cancelled") {
    job.cancellation = {
      cancelledBy: req.user._id,
      cancelledAt: new Date(),
      reason: updateMessage || "Cancelled by client",
    };
  }

  // Update progress if provided
  if (progressPercentage !== undefined) {
    job.progress.percentage = Math.max(0, Math.min(100, progressPercentage));
  }

  // Add progress update
  if (updateMessage) {
    job.progress.updates.push({
      message: updateMessage,
      updatedBy: req.user._id,
      attachments: attachments || [],
    });
  }

  await job.save();

  // Create notification for worker based on status change
  if (job.worker) {
    let notificationMessage = "";
    let notificationType = "general";

    switch (status) {
      case "cancelled":
        notificationMessage = `The job "${job.title}" has been cancelled by the client`;
        notificationType = "job_cancelled";
        break;
      case "revision_requested":
        notificationMessage = `Client has requested revisions for "${job.title}"`;
        notificationType = "revision_requested";
        break;
      case "completed":
        notificationMessage = `Client has marked "${job.title}" as completed`;
        notificationType = "job_completed";
        break;
    }

    if (notificationMessage) {
      try {
        await NotificationService.createNotification({
          recipients: [job.worker._id],
          sender: req.user._id,
          title: "Job Status Update",
          message: notificationMessage,
          type: notificationType,
          relatedJob: job._id,
          actionButton: {
            text: "View Job",
            url: `/worker/jobs/${job._id}`,
            action: "view_job",
          },
        });
      } catch (error) {
        console.error(
          "Failed to create job status update notification:",
          error
        );
        // Don't fail the status update if notification fails
      }
    }
  }

  res.status(200).json({
    success: true,
    message: "Job status updated successfully",
    data: job,
  });
});

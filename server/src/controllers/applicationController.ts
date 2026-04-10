import { Response } from 'express';
import { AuthRequest } from '../types';
import Application from '../models/Application';

// GET /api/applications
export const getAllApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const applications = await Application.find({ userId: req.userId }).sort({
      dateApplied: -1,
    });
    res.status(200).json(applications);
  } catch (error) {
    console.error('[getAllApplications]', error);
    res.status(500).json({ message: 'Failed to fetch applications.' });
  }
};

// POST /api/applications
export const createApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const application = await Application.create({
      ...req.body,
      userId: req.userId,
    });
    res.status(201).json(application);
  } catch (error) {
    console.error('[createApplication]', error);
    res.status(500).json({ message: 'Failed to create application.' });
  }
};

// PUT /api/applications/:id
export const updateApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!application) {
      res.status(404).json({ message: 'Application not found.' });
      return;
    }

    res.status(200).json(application);
  } catch (error) {
    console.error('[updateApplication]', error);
    res.status(500).json({ message: 'Failed to update application.' });
  }
};

// DELETE /api/applications/:id
export const deleteApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found.' });
      return;
    }

    res.status(200).json({ message: 'Application deleted successfully.' });
  } catch (error) {
    console.error('[deleteApplication]', error);
    res.status(500).json({ message: 'Failed to delete application.' });
  }
};

require 'fileutils'

class MetadataController < ApplicationController
  def index
    dir = job_path(params)
    if !Dir.exist?(dir)
      render status: 404, json: { error: "Job not found" }
    else
      job = Job.new dir
      render json: job.metadata.raw
    end
  end

  def derivatives
    dir = job_path(params)
    if !Dir.exist?(dir)
      render status: 404, json: { error: "Job not found" }
    else
      job = Job.new dir
      render json: job.metadata.derivative_status
    end
  end

  def make_derivatives
    dir = job_path(params)
    if !Dir.exist?(dir)
      render status: 404, json: { error: "Job not found" }
    else
      job = Job.new dir
      status = job.metadata.derivative_status
      lockfile = job.metadata.derivative_lockfile
      if (status[:expected] > status[:processed] && !File.exist?(lockfile))
        FileUtils.touch lockfile
        Resque.enqueue(DerivativeGenerator, dir)
      end
      render json: status
    end
  end

  def update
    dir = job_path(params)
    if !Dir.exist?(dir)
      render status: 404, json: { error: "Job not found" }
    else
      job = Job.new dir
      if !JobMetadataValidator.valid?(job, params)
        render status: 400, json: { error: "Invalid JSON document" }
      else
        job.metadata.raw = params
        job.metadata.save
        render json: { status: 'ok' }
      end
    end
  end
end

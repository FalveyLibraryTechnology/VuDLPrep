require 'fileutils'

class MetadataController < ApplicationController
  before_filter :job_exists

  def index
    job = Job.new job_path(params)
    render json: job.metadata.raw
  end

  def status
    job = Job.new job_path(params)
    render json: job.metadata.status
  end

  def make_derivatives
    job = Job.new job_path(params)
    status = job.metadata.derivative_status
    lockfile = job.metadata.derivative_lockfile
    if (status[:expected] > status[:processed] && !File.exist?(lockfile))
      FileUtils.touch lockfile
      Resque.enqueue(DerivativeGenerator, job.dir)
    end
    render json: status
  end

  def update
    job = Job.new job_path(params)
    if !JobMetadataValidator.valid?(job, params)
      render status: 400, json: { error: "Invalid JSON document" }
    else
      job.metadata.raw = params
      job.metadata.save
      if (params[:published])
        Resque.enqueue(Fedora3Ingestor, job.dir)
      end
      render json: { status: 'ok' }
    end
  end

  private

  def job_exists
    dir = job_path(params)
    if !Dir.exist?(dir)
      render status: 404, json: { error: "Job not found" }
    end
  end
end

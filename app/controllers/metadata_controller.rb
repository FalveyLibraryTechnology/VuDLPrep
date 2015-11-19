
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

  def ingest
    Job.new(job_path(params)).ingest
    render json: { status: 'ok' }
  end

  def make_derivatives
    Job.new(job_path(params)).make_derivatives
    render json: { status: 'ok' }
  end

  def update
    job = Job.new job_path(params)
    if !JobMetadataValidator.valid?(job, params)
      render status: 400, json: { error: "Invalid JSON document" }
    else
      job.metadata.raw = params
      job.metadata.save
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

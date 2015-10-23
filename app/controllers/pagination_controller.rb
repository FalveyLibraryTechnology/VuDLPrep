require 'json'

class PaginationController < ApplicationController
  def index
    dir = jobPath(params)
    if !Dir.exist?(dir)
      render status: 404, json: { error: "Job not found" }
    else
      job = Job.new dir
      render json: job.metadata.raw
    end
  end

  def update
    dir = jobPath(params)
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

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
      if !validate_update_params(job, params)
        render status: 400, json: { error: "Invalid JSON document" }
      else
        job.metadata.raw = params
        job.metadata.save
        render json: { status: 'ok' }
      end
    end
  end

  def validate_update_params(job, params)
    if !defined? params[:order]
      return false
    end
    validate_order(job, params[:order])
  end
  
  def validate_order(job, order)
    old = job.metadata.order.raw.map { |entry| entry[:filename]}
    new = order.map { |entry| entry[:filename] }
    diff = old - new
    (diff.empty? && old.length == new.length)
  end
end

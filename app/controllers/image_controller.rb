require 'fileutils'

class ImageController < ApplicationController
  def thumb
    handle_image(params, 'THUMBNAIL', 120)
  end

  def medium
    handle_image(params, 'MEDIUM', 640)
  end

  def large
    handle_image(params, 'LARGE', 3000)
  end

  def handle_image(params, size, constraint)
    orig = orig_image_path(params)
    if !File.exist?(orig)
      render status: 404, json: { status: 'image missing' }
      return
    end
    deriv = Image.new(orig).derivative(size, constraint)
    send_file deriv, type: "image/jpeg", disposition: "inline"
  end

  def orig_image_path(params)
    dir = job_path(params)
    filename = params[:image].gsub(/[^\w.]/, '')
    "#{dir}/#{filename}"
  end
end

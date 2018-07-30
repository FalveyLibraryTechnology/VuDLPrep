require 'fileutils'

class ImageController < ApplicationController
  def thumb
    handle_image(params, 'THUMBNAIL')
  end

  def medium
    handle_image(params, 'MEDIUM')
  end

  def large
    handle_image(params, 'LARGE')
  end

  def handle_image(params, size)
    orig = orig_image_path(params)
    if !File.exist?(orig)
      render status: 404, json: { status: 'image missing' }
      return
    end
    deriv = Image.new(orig).derivative(size)
    send_file deriv, type: "image/jpeg", disposition: "inline"
  end

  def orig_image_path(params)
    dir = job_path(params)
    filename = params[:image].gsub(/[^-\w.]/, '')
    "#{dir}/#{filename}"
  end
end

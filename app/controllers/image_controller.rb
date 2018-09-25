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

  def delete
    image = load_image(params)
    if (image)
      image.delete
      render json: { status: 'ok' }
    else
      render status: 404, json: { status: 'image missing' }
    end
  end

  def handle_image(params, size)
    image = load_image(params)
    if (image)
      send_file image.derivative(size), type: "image/jpeg", disposition: "inline"
    else
      render status: 404, json: { status: 'image missing' }
    end
  end

  def load_image(params)
    orig = orig_image_path(params)
    if !File.exist?(orig)
      return
    end
    Image.new(orig)
  end

  def orig_image_path(params)
    dir = job_path(params)
    filename = params[:image].gsub(/[^-\w.]/, '')
    "#{dir}/#{filename}"
  end
end

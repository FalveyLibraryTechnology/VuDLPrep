require 'fileutils'
require 'rmagick'

class ImageController < ApplicationController
  include Magick

  def thumb
    handleImage(params, 'THUMBNAIL', 120)
  end

  def medium
    handleImage(params, 'MEDIUM', 640)
  end

  def large
    handleImage(params, 'LARGE', 3000)
  end

  def handleImage(params, size, constraint)
    tiff = tiffPath(params)
    deriv = derivativePath(params, size)
    if !File.exist?(deriv)
      path = File.dirname(deriv)
      FileUtils.mkdir_p path unless File.exist?(path)
      image = ImageList.new(tiff)
      image.resize_to_fit!(constraint)
      image.write(deriv)
    end
    send_file deriv, type: "image/jpeg", disposition: "inline"
  end

  def tiffPath(params)
    dir = jobPath(params)
    filename = params[:image].gsub(/[^\w.]/, '')
    "#{dir}/#{filename}"
  end

  def derivativePath(params, size)
    dir = jobPath(params)
    filename = File.basename(tiffPath(params), '.TIF')
    "#{dir}/#{filename}/#{size}/#{filename}.jpg"
  end
end

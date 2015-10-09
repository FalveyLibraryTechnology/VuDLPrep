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
    tiff = getTiffFromParams(params)
    deriv = getDerivativeFromParams(params, size)
    if !File.exist?(deriv)
      path = File.dirname(deriv)
      FileUtils.mkdir_p path unless File.exist?(path)
      image = ImageList.new(tiff)
      image.resize_to_fit!(constraint)
      image.write(deriv)
    end
    send_file deriv, type: "image/jpeg", disposition: "inline"
  end

  def getTiffFromParams(params)
    dir = getDirFromParams(params)
    filename = params[:image].gsub(/[^\w.]/, '')
    "#{dir}/#{filename}"
  end

  def getDerivativeFromParams(params, size)
    dir = getDirFromParams(params)
    filename = File.basename(getTiffFromParams(params), '.TIF')
    "#{dir}/#{filename}/#{size}/#{filename}.jpg"
  end
end

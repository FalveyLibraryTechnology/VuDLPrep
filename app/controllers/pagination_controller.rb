require 'json'

class PaginationController < ApplicationController
  def index
    dir = getDirFromParams(params)
    if !Dir.exist?(dir)
      render status: 404, json: { error: "Job not found" }
    else
      orderDoc = getOrderDocFromDir(dir)
      render json: orderDoc
    end
  end

  def getDirFromParams(params)
    # Sanitize directory path components:
    category = params[:category].gsub(/\W/, '')
    job = params[:job].gsub(/\W/, '')

    # Build full path:
    "/usr/local/holding/#{category}/#{job}"
  end

  def getTiffsFromDir(dir)
    Dir.glob("#{dir}/*.TIF")
  end

  def generateOrderDocForDir(dir, file)
    tiffs = []
    getTiffsFromDir(dir).each do |tiff|
      line = { filename: File.basename(tiff), label: nil }
      tiffs.push line
    end
    data = { order: tiffs }
    File.open(file, 'w') do |file|
      file.write data.to_json
    end
  end

  def getOrderDocFromDir(dir)
    file = "#{dir}/order.json"
    if !File.exist?(file)
      generateOrderDocForDir(dir, file)
    end
    File.open(file) do |f|
      f.read
    end
  end
end

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

  def update
    dir = getDirFromParams(params)
    if !Dir.exist?(dir)
      render status: 404, json: { error: "Job not found" }
    else
      newJson = params[:order]
      if !validateJson(dir, newJson)
        render status: 500, json: { error: "Invalid JSON document" }
      else
        file = getOrderDocFilenameFromDir(dir)
        writeJsonToFile(file, { order: newJson })
        render json: { status: 'ok' }
      end
    end
  end

  def validateJson(dir, newJson)
    if newJson
      oldTiffs = getTiffsFromDir(dir)
      newTiffs = newJson.map { |entry| entry[:filename] }
      diff = oldTiffs - newTiffs
      if (diff.empty? && oldTiffs.length == newTiffs.length)
        return true
      end
    end
  end

  def getTiffsFromDir(dir)
    Dir.glob("#{dir}/*.TIF").map { |tiff| File.basename(tiff) }
  end

  def generateOrderDocForDir(dir, file)
    tiffs = []
    getTiffsFromDir(dir).each do |tiff|
      line = { filename: tiff, label: nil }
      tiffs.push line
    end
    data = { order: tiffs }
    writeJsonToFile(file, data)
  end

  def getOrderDocFilenameFromDir(dir)
    "#{dir}/order.json"
  end

  def getOrderDocFromDir(dir)
    file = getOrderDocFilenameFromDir(dir)
    if !File.exist?(file)
      generateOrderDocForDir(dir, file)
    end
    File.open(file) do |f|
      f.read
    end
  end

  def writeJsonToFile(file, data)
    File.open(file, 'w') do |file|
      file.write data.to_json
    end
  end
end

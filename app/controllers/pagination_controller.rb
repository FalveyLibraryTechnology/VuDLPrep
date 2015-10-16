require 'json'

class PaginationController < ApplicationController
  def index
    dir = jobPath(params)
    if !Dir.exist?(dir)
      render status: 404, json: { error: "Job not found" }
    else
      orderDocContents = orderDoc(dir)
      render json: orderDocContents
    end
  end

  def update
    dir = jobPath(params)
    if !Dir.exist?(dir)
      render status: 404, json: { error: "Job not found" }
    else
      newJson = params[:order]
      if !validateJson(dir, newJson)
        render status: 400, json: { error: "Invalid JSON document" }
      else
        file = orderDocPath(dir)
        writeJsonToFile(file, { order: newJson })
        render json: { status: 'ok' }
      end
    end
  end

  def validateJson(dir, newJson)
    if newJson
      oldTiffs = tiffs(dir)
      newTiffs = newJson.map { |entry| entry[:filename] }
      diff = oldTiffs - newTiffs
      if (diff.empty? && oldTiffs.length == newTiffs.length)
        return true
      end
    end
  end

  def tiffs(dir)
    Dir.glob("#{dir}/*.TIF").sort.map { |tiff| File.basename(tiff) }
  end

  def generateOrderDoc(dir, file)
    order = []
    tiffs(dir).each do |tiff|
      line = { filename: tiff, label: nil }
      order.push line
    end
    data = { order: order }
    writeJsonToFile(file, data)
  end

  def orderDocPath(dir)
    "#{dir}/order.json"
  end

  def orderDoc(dir)
    file = orderDocPath(dir)
    if !File.exist?(file)
      generateOrderDoc(dir, file)
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

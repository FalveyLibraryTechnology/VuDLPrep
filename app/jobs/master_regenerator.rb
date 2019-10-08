require 'rexml/document'
require 'rexml/xpath'

class MasterRegenerator
    @queue = :ingests

    def self.get_resource_collection_pid(pid)
      solr = SolrObject.new
      params = {
        q: "id:\"#{pid}\"",
        fl: "hierarchy_all_parents_str_mv"
      }
      response = solr.query params
      parents = response["response"]["docs"][0]["hierarchy_all_parents_str_mv"]
      
      params2 = {
        q: "modeltype_str_mv:\"vudl-system:ResourceCollection\" AND id:(\""+parents.join("\" OR \"") + "\")",
        fl:"id"
      }
      response2 = solr.query params2
      response2["response"]["docs"][0]["id"]
    end

    def self.update_process_md(pid)
      ns = {"DIGIPROVMD" => "http://www.loc.gov/PMD"}
      resource_collection_pid = self.get_resource_collection_pid pid
      resource_collection = Fedora3Object.from_pid(resource_collection_pid)
      processmd = resource_collection.datastream_dissemination('PROCESS-MD')
      xml = REXML::Document.new(processmd)
      next_id = REXML::XPath.match(xml, "//DIGIPROVMD:task/@ID", ns).map { |i| i.to_s.to_i }.max + 1
      container = REXML::XPath.first(xml, '//DIGIPROVMD:DIGIPROVMD', ns)
      task = container.add_element "DIGIPROVMD:task", {"ID"=>next_id}
      label = task.add_element "DIGIPROVMD:task_label"
      label.text = "Regenerated master"
      desc = task.add_element "DIGIPROVMD:task_description"
      desc.text = "Regenerated TIFF from JPEG using ImageMagick for PID " + pid
      seq = task.add_element "DIGIPROVMD:task_sequence"
      seq.text = 1
      individual = task.add_element "DIGIPROVMD:task_individual"
      tool = task.add_element "DIGIPROVMD:tool"
      tool_label = tool.add_element "DIGIPROVMD:tool_label"
      tool_label.text = "VuDLPrep"
      tool_desc = tool.add_element "DIGIPROVMD:tool_description"
      tool_make = tool.add_element "DIGIPROVMD:tool_make"
      tool_make.text = "Falvey Memorial Library"
      tool_version = tool.add_element "DIGIPROVMD:tool_version"
      tool_version.text = "Revised 10/8/2019"
      tool_serial = tool.add_element "DIGIPROVMD:tool_serial_number"
      formatter = REXML::Formatters::Pretty.new
      formatter.compact = true
      resource_collection.add_datastream_from_string formatter.write(xml.root, ""), 'PROCESS-MD', 'text/xml'
    end

    def self.perform(pid)
      page = Fedora3Object.from_pid(pid)
      jpg_data = page.datastream_dissemination('LARGE')
      filename = "/tmp/#{SecureRandom.urlsafe_base64}.JPG"
      File.open(filename, "w:ASCII-8BIT") do |f|
        f.write jpg_data.to_s
      end
      image = ::Magick::Image.read(filename).first
      filenameTIFF = "/tmp/#{SecureRandom.urlsafe_base64}.TIFF"
      image.write(filenameTIFF)
      begin
        masterdata = page.datastream_dissemination('MASTER')
      rescue RuntimeError
        page.add_datastream_from_file filenameTIFF, 'MASTER', 'image/tiff'
        page.add_master_metadata_datastream
      end

      self.update_process_md pid

      File.delete(filename)
      File.delete(filenameTIFF)
    end
end